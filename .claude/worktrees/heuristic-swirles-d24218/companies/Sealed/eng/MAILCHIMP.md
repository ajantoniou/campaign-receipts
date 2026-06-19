# SEALED Press — Mailchimp sync path (tracker step 43)

Subscribe flow: **`POST /api/email/subscribe`** always writes **Supabase** first. **Mailchimp** sync runs after a successful upsert and **never blocks** success if Mailchimp is misconfigured.

## Env (Render / Vercel)

| Key | Purpose |
| --- | ------- |
| `MAILCHIMP_API_KEY` | Data-center API key (required for Mailchimp) |
| `MAILCHIMP_AUDIENCE_ID` | List / audience UUID |
| `MAILCHIMP_DC_REGION` | Data center subdomain (default **`us1`**) |

If **`MAILCHIMP_API_KEY`** or **`MAILCHIMP_AUDIENCE_ID`** is missing:

- Subscriber is **still stored** in Supabase when Supabase env is present.
- The route warns in server logs: Mailchimp not configured (copy is **never** echoed to browser JSON).

Contacts are added as **`pending`** (double opt-in) with merge fields **`FNAME`**, **`SOURCE`**.
