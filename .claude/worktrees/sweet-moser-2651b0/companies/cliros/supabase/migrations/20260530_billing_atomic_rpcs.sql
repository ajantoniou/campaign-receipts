-- ─── Billing atomicity: Postgres RPCs for the money paths ───
-- The TS call-sites did multi-step credit/debit/refund as separate statements
-- with no transaction, so a partial failure (or a concurrent call) could
-- double-spend or leave balances inconsistent. These plpgsql functions make
-- each money operation atomic and idempotent in a single round-trip.
--
-- Tables (schema: cliros): users(id, reports_remaining, reports_purchased_total,
--   reports_consumed_total, monthly_report_cap, ...), report_packages(id,
--   user_id, ls_order_id, size, amount_cents, reports_remaining, expires_at,
--   created_at), search_reports(id, is_free_trial, amount_cents, ...),
--   report_refunds(report_id UNIQUE, user_id, reason, credit_kind, package_id,
--   ls_usage_record_id, notes).
--
-- NOTE: report_packages had NO unique constraint on ls_order_id (verified
-- 2026-05-30) — the webhook's idempotency was a TOCTOU-prone SELECT-then-INSERT.
-- We add a partial unique index so ON CONFLICT works as the atomic anchor.

-- ── 0. Idempotency anchor for package orders ──
-- Partial: only enforce uniqueness for real LS orders (ls_order_id NOT NULL).
-- Manually-granted packages (no LS order) are exempt.
CREATE UNIQUE INDEX IF NOT EXISTS report_packages_ls_order_id_uniq
  ON cliros.report_packages (ls_order_id)
  WHERE ls_order_id IS NOT NULL;

-- ── 1. credit_package_order ──
-- Atomic, idempotent package-purchase credit. Called by the LS order_created
-- webhook. Inserts the package row AND bumps the user balance in one tx.
-- Idempotent on ls_order_id: a webhook retry returns credited=false.
CREATE OR REPLACE FUNCTION cliros.credit_package_order(
  p_user        uuid,
  p_ls_order    text,
  p_size        int,
  p_amount      int,
  p_expires_at  timestamptz DEFAULT (now() + interval '12 months')
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cliros, public
AS $$
DECLARE
  v_pkg_id uuid;
BEGIN
  -- Atomic claim: the partial unique index makes this a no-op on retry.
  INSERT INTO cliros.report_packages
    (user_id, ls_order_id, size, amount_cents, reports_remaining, expires_at)
  VALUES
    (p_user, p_ls_order, p_size, p_amount, p_size, p_expires_at)
  ON CONFLICT (ls_order_id) WHERE ls_order_id IS NOT NULL DO NOTHING
  RETURNING id INTO v_pkg_id;

  IF v_pkg_id IS NULL THEN
    -- Already credited (idempotent retry) — do NOT bump the user balance again.
    RETURN jsonb_build_object('credited', false, 'reason', 'duplicate_order');
  END IF;

  UPDATE cliros.users
     SET reports_remaining       = reports_remaining + p_size,
         reports_purchased_total = reports_purchased_total + p_size
   WHERE id = p_user;

  RETURN jsonb_build_object('credited', true, 'package_id', v_pkg_id, 'size', p_size);
END;
$$;

-- ── 2. debit_report_package ──
-- Atomic package debit for a report run. Decrements the oldest non-expired
-- package with remaining balance AND the user balance, and stamps the report,
-- all in one tx. Returns debited=false (no balance) so the caller can 402
-- cleanly without having mutated anything.
CREATE OR REPLACE FUNCTION cliros.debit_report_package(
  p_user    uuid,
  p_report  uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cliros, public
AS $$
DECLARE
  v_pkg_id uuid;
BEGIN
  -- Lock the oldest non-expired package with balance so concurrent debits
  -- can't both take the last report. FIFO by expiry (mirrors prior logic).
  SELECT id INTO v_pkg_id
    FROM cliros.report_packages
   WHERE user_id = p_user
     AND reports_remaining > 0
     AND (expires_at IS NULL OR expires_at >= now())
   ORDER BY expires_at ASC NULLS LAST
   LIMIT 1
   FOR UPDATE SKIP LOCKED;

  IF v_pkg_id IS NULL THEN
    RETURN jsonb_build_object('debited', false, 'reason', 'no_balance');
  END IF;

  UPDATE cliros.report_packages
     SET reports_remaining = reports_remaining - 1
   WHERE id = v_pkg_id;

  UPDATE cliros.users
     SET reports_remaining     = GREATEST(0, reports_remaining - 1),
         reports_consumed_total = reports_consumed_total + 1
   WHERE id = p_user;

  UPDATE cliros.search_reports
     SET is_free_trial = false,
         amount_cents  = 20000
   WHERE id = p_report;

  RETURN jsonb_build_object('debited', true, 'package_id', v_pkg_id);
END;
$$;

-- ── 3. claim_refund ──
-- Atomic refund CLAIM that closes the TOCTOU/re-refund window. Inserts the
-- report_refunds audit row FIRST (the UNIQUE(report_id) is the claim). Only if
-- the claim is newly taken does it reverse the credit; a concurrent/retry call
-- gets claimed=false and must NOT touch LemonSqueezy. The caller does the LS
-- decrement ONLY when claimed=true, so LS can never be double-decremented.
-- For package/free rails the credit reversal happens here atomically; for the
-- metered rail the caller posts the LS offset after a true claim and may patch
-- ls_usage_record_id via patch_refund_ls_usage below.
CREATE OR REPLACE FUNCTION cliros.claim_refund(
  p_report  uuid,
  p_reason  text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cliros, public
AS $$
DECLARE
  v_user       uuid;
  v_free       boolean;
  v_stripe     text;
  v_pkg_id     uuid;
  v_credit     text;
  v_rows       int;
BEGIN
  SELECT user_id, is_free_trial, stripe_payment_id
    INTO v_user, v_free, v_stripe
    FROM cliros.search_reports
   WHERE id = p_report;

  IF v_user IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'report_not_found');
  END IF;

  -- Atomic claim via UNIQUE(report_id). Insert a placeholder row; if it
  -- conflicts, another refund already owns this report → bail without touching
  -- any balance or LS.
  INSERT INTO cliros.report_refunds (report_id, user_id, reason, credit_kind, notes)
  VALUES (p_report, v_user, p_reason, 'pending', 'claim in progress')
  ON CONFLICT (report_id) DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'already_refunded');
  END IF;

  -- Mark the report un-billed (UI banner reads this).
  UPDATE cliros.search_reports
     SET billed = false, refund_reason = p_reason
   WHERE id = p_report;

  -- Free trial / beta: never billed, no credit movement.
  IF v_free THEN
    UPDATE cliros.report_refunds
       SET credit_kind = 'free_trial',
           notes = 'No credit movement — report was on free trial.'
     WHERE report_id = p_report;
    RETURN jsonb_build_object('claimed', true, 'credit_kind', 'free_trial');
  END IF;

  -- Metered: the caller posts the LS offset after this returns claimed=true.
  -- We record the rail now; the caller patches ls_usage_record_id afterward.
  IF v_stripe LIKE 'ls_usage_%' THEN
    UPDATE cliros.report_refunds
       SET credit_kind = 'metered',
           ls_usage_record_id = replace(v_stripe, 'ls_usage_', ''),
           notes = 'Metered claim — caller posts LS decrement.'
     WHERE report_id = p_report;
    RETURN jsonb_build_object('claimed', true, 'credit_kind', 'metered',
                              'ls_usage_record_id', replace(v_stripe, 'ls_usage_', ''));
  END IF;

  -- Package rail: reverse the debit atomically (mirror of debit_report_package).
  SELECT id INTO v_pkg_id
    FROM cliros.report_packages
   WHERE user_id = v_user
     AND (expires_at IS NULL OR expires_at >= now())
   ORDER BY expires_at ASC NULLS LAST
   LIMIT 1
   FOR UPDATE SKIP LOCKED;

  IF v_pkg_id IS NOT NULL THEN
    UPDATE cliros.report_packages
       SET reports_remaining = reports_remaining + 1
     WHERE id = v_pkg_id;
    v_credit := 'package';
  ELSE
    v_credit := 'none';
  END IF;

  UPDATE cliros.users
     SET reports_remaining     = reports_remaining + 1,
         reports_consumed_total = GREATEST(0, reports_consumed_total - 1)
   WHERE id = v_user;

  UPDATE cliros.report_refunds
     SET credit_kind = v_credit,
         package_id  = v_pkg_id,
         notes = CASE WHEN v_pkg_id IS NOT NULL
                   THEN 'Credited +1 to package and users.reports_remaining.'
                   ELSE 'No active package — credited users.reports_remaining only.' END
   WHERE report_id = p_report;

  RETURN jsonb_build_object('claimed', true, 'credit_kind', v_credit, 'package_id', v_pkg_id);
END;
$$;

-- Patch the LS offset id onto a metered refund row after the caller posts it.
CREATE OR REPLACE FUNCTION cliros.patch_refund_ls_usage(
  p_report    uuid,
  p_ls_offset text,
  p_ok        boolean
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cliros, public
AS $$
BEGIN
  UPDATE cliros.report_refunds
     SET ls_usage_record_id = COALESCE(p_ls_offset, ls_usage_record_id),
         notes = CASE WHEN p_ok
                   THEN 'Posted offsetting decrement usage record ' || COALESCE(p_ls_offset,'?') || '.'
                   ELSE 'LS decrement failed — manual comp may be needed if usage already invoiced.' END
   WHERE report_id = p_report;
END;
$$;

-- ── 4. cleanup_expired_packages ──
-- Zero out expired packages so stale balances can't be debited and the table
-- doesn't accumulate dangling rows. Idempotent. Returns count zeroed.
CREATE OR REPLACE FUNCTION cliros.cleanup_expired_packages()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cliros, public
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE cliros.report_packages
     SET reports_remaining = 0
   WHERE expires_at IS NOT NULL
     AND expires_at < now()
     AND reports_remaining > 0;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ── GRANTs (Oct-2026 breaking change: new objects need explicit grants) ──
GRANT EXECUTE ON FUNCTION cliros.credit_package_order(uuid, text, int, int, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION cliros.debit_report_package(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION cliros.claim_refund(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION cliros.patch_refund_ls_usage(uuid, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION cliros.cleanup_expired_packages() TO service_role;
