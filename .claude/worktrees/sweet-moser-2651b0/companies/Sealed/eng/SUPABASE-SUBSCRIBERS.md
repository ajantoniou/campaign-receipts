# SEALED Press — Supabase subscriber table (`email_subscribers`)

## Verify (tracker step 42)

[`app/api/email/subscribe/route.ts`](../app/api/email/subscribe/route.ts) upserts into **`public.email_subscribers`**:

| Column            | Typed from route                         |
| ----------------- | ---------------------------------------- |
| `email`           | Form field `email` (required, unique)    |
| `first_name`      | Optional                                 |
| `source_book_id`  | **`TEXT`** slug (default form value `sealed`) |
| `tags`            | Default `{}`                             |

Provision with [`../supabase/migrations/001_email_subscribers.sql`](../supabase/migrations/001_email_subscribers.sql). If Supabase replies with “relation does not exist”, the migration has not been applied to that project.

**Concise overlap:** [`companies/concise/migrations/001-create-concise-schema.sql`](../../concise/migrations/001-create-concise-schema.sql) defines **`concise.email_subscribers`** with UUID `source_book_id` FK to **`concise.books`**. The standalone SEALED app intentionally uses **`public`** + TEXT for opaque source labels.
