# EIKHOFF report panel — `87648f5f-c691-4198-8b4a-fe5f6859ae74`

**Orchestrator:** `fix` · ship confidence **15%**

## Consensus blocking issues (P1 engine)

1. **Grantor = grantee on every deed** — GSCCCA index parse treats searched name as both parties when grantor/grantee fields empty.
2. **deed-13 grantee "Unknown"** — extraction failure presented as title gap.
3. **11 "active" security deeds, creditor "Unknown"** — no cancellation pairing by book/page; cancellations list borrower as creditor.
4. **Federal tax lien narrative** — names in defects not in `liens[]` payload (strict match may have fixed runtime; panel run predates or narrative stale).
5. **Count mismatch** — defect says 11 liens, payload has 10.

## Per persona

| Persona | Verdict | Severity | Top concern |
|---------|---------|----------|-------------|
| attorney | kill | 85 | Cannot put name on chain; parser broken |
| compliance | fix | 55 | Self-deeds, Unknown grantee/creditor, unsupported FTL narrative |
| design | fix | 55 | UI must flag parse artifacts, not bare "Unknown" |
| growth | ship | 20 | Good for trial activation (disagrees with attorney) |
| title_co | fix | 55 | Lien pairing; 11 open mortgages likely wrong |
| vc | fix | 55 | Lien-pairing + extraction = accuracy liability |

**Ship blocker for demo quality:** GSCCCA `parseDeedResults` intra-family / paired-row merge (Task #23).

## Post-fix rerun (same session)

After `parseDeedResults` merge-by-book-page + party-row extraction:

- Chain stored as **4 conveyances** (not 26 self-deeds): e.g. `Unknown -> EIKHOFF, CHAD E` (index gap on grantor, not grantor=grantee).
- Panel still **kill** @ 5% — primary blockers: (1) 10+ apparent active security deeds without cancellation book/page pairing, (2) bankruptcy/FTL defects need stricter gating, (3) risk score driven by data-quality not proven defects.
- Next engine work: cancellation↔SD book/page matcher (separate from grantor/grantee merge).
