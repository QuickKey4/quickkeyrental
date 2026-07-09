# Supabase migrations

Apply pending migrations when the Supabase project is connected:

```bash
supabase link --project-ref ipcafhvrderkivpqtnpb
supabase db push
```

Or paste the SQL from `migrations/*.sql` into the Supabase Dashboard → SQL Editor.

## Pending: booking availability fix

**File:** `20260613120000_fix_booking_availability_overlap.sql`

Fixes cars being marked unavailable for the entire year after a single booking. Availability is now based on **date-range overlap** only:

| Existing booking | New request   | Result        |
|------------------|---------------|---------------|
| Jun 12 – Jun 15  | Jun 1 – Jun 11 | Available   |
| Jun 12 – Jun 15  | Jun 10 – Jun 13 | Blocked    |
| Jun 12 – Jun 15  | Jun 14 – Jun 18 | Blocked    |
| Jun 12 – Jun 15  | Jun 16 – Jun 20 | Available  |

### Verify after applying

```sql
-- Replace dates/car as needed
select name, image_url, available
from public.get_car_availability('2026-06-01'::date, '2026-06-11'::date);

select name, image_url, available
from public.get_car_availability('2026-06-16'::date, '2026-06-20'::date);
```

Only `pending` and `confirmed` bookings block availability. `cancelled` bookings are ignored.

---

## Auth email templates (Supabase Dashboard)

Minimal Quick Key branded HTML lives in `email-templates/`.

### Magic link (sign-in / account access)

1. Supabase Dashboard → **Authentication** → **Email Templates** → **Magic Link**
2. **Subject:** paste from `email-templates/magic-link-subject.txt`
3. **Body:** paste full contents of `email-templates/magic-link.html`
4. Save

Uses `{{ .ConfirmationURL }}` and `{{ .Email }}` (Supabase Go template variables).

### Confirm email change (profile → new email)

1. **Email Templates** → **Change email address** (or **Confirm signup** if that is what your project shows for email change)
2. **Subject:** `email-templates/confirm-email-change-subject.txt`
3. **Body:** `email-templates/confirm-email-change.html`

### Preview locally

Open the `.html` files in a browser. Replace `{{ .ConfirmationURL }}` with a test URL and `{{ .Email }}` with a sample address to preview layout.

Header uses a **text wordmark** (not a hosted image) so it renders reliably in Supabase preview, Gmail, and Outlook.
