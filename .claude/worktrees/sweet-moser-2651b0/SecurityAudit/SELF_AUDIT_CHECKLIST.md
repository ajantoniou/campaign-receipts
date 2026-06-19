# Self-Audit Checklist

Run this quarterly or after any significant deployment. Takes ~30 minutes.

## Health endpoint information leakage

```bash
# Should return ONLY {"status":"ok"} or {"status":"degraded"} — no buildId, service name, or env booleans
curl -s https://estimateproof.com/api/health | python3 -m json.tool
curl -s https://sealed2016.com/api/health | python3 -m json.tool
curl -s https://campaignreceipts.com/api/health | python3 -m json.tool
```

- [ ] No `buildId` field
- [ ] No `service` field
- [ ] No `env` object
- [ ] No `timestamp` field

## Origin leak check

```bash
# Should reference the public domain, not *.onrender.com
curl -s https://sealed2016.com/robots.txt
curl -s https://sealed2016.com/sitemap.xml
```

- [ ] No `onrender.com` URLs in robots.txt
- [ ] No `onrender.com` URLs in sitemap.xml

## Security headers

```bash
# Check all three sites
for domain in estimateproof.com sealed2016.com campaignreceipts.com; do
  echo "=== $domain ==="
  curl -sI "https://$domain/" | grep -iE "strict-transport|x-frame|x-content-type|content-security|referrer-policy|permissions-policy"
  echo
done
```

- [ ] `Strict-Transport-Security` present on all three
- [ ] `X-Frame-Options: DENY` present on all three
- [ ] `X-Content-Type-Options: nosniff` present on all three
- [ ] `Content-Security-Policy` present on all three
- [ ] `Referrer-Policy` present on all three

## Webhook signature validation

```bash
# Should return 400 (missing signature), NOT 200
curl -s -o /dev/null -w "%{http_code}" -X POST \
  https://estimateproof.com/api/webhooks/lemonsqueezy \
  -H 'Content-Type: application/json' \
  -d '{"meta":{"event_name":"test"}}'

# Same for sealed2016
curl -s -o /dev/null -w "%{http_code}" -X POST \
  https://sealed2016.com/api/lemon-squeezy/webhook \
  -H 'Content-Type: application/json' \
  -d '{"meta":{"event_name":"test"}}'
```

- [ ] estimateproof returns 400
- [ ] sealed2016 returns 401

## Rate limiting

```bash
# Send 7 rapid requests — last 2 should get 429
for i in $(seq 1 7); do
  echo -n "Request $i: "
  curl -s -o /dev/null -w "%{http_code}" -X POST \
    https://estimateproof.com/api/waitlist \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@test.com"}'
  echo
done
```

- [ ] Requests 6+ return 429

## Frontend secret scanning

```bash
# View page source and search for service_role key (should NOT appear)
curl -s https://estimateproof.com/ | grep -i "service_role\|eyJhbG"
curl -s https://sealed2016.com/ | grep -i "service_role\|eyJhbG"
curl -s https://campaignreceipts.com/ | grep -i "service_role\|eyJhbG"
```

- [ ] No `service_role` matches
- [ ] Only anon keys (short `eyJ...` JWTs are expected for anon key)

## Auth callback open redirect

```bash
# Should redirect to /login, NOT to evil.com
curl -s -o /dev/null -w "%{redirect_url}" \
  "https://estimateproof.com/auth/callback?next=https://evil.com"
```

- [ ] Redirects to `/login` or `/dashboard`, not external URL

## Admin endpoint protection

```bash
# Should return 401 without API key
curl -s -o /dev/null -w "%{http_code}" \
  https://sealed2016.com/api/lemon-squeezy/products
```

- [ ] Returns 401

## Supabase RLS verification

Log into Supabase dashboard and verify:

- [ ] RLS is enabled on ALL tables in all schemas
- [ ] `estimateproof.reports` has policy: `owner_id = auth.uid()`
- [ ] `estimateproof.subscriptions` has appropriate read policy
- [ ] `public.email_subscribers` has INSERT-only policy for anon
- [ ] `cr_*` tables have appropriate RLS policies
