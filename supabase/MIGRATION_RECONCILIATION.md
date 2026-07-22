# Migration Reconciliation

Last audit date: 2026-07-16

## Current Warning

The local migration folder and live Supabase migration history are not 1:1 aligned.

NEVER run blanket `supabase db push`.

NEVER run `supabase migration repair` without explicit approval.

The production schema is currently operational. A migration ledger mismatch does not automatically mean that schema is missing.

## Live Project

- Project ref: `ipcafhvrderkivpqtnpb`
- Project name: Quick Key

## Summary

Production contains several migrations under Supabase-generated timestamps while the repository contains equivalent files with different timestamps.

Some schema changes were also applied manually or through narrow SQL and are live in the schema but are not recorded in the production migration ledger under the local repository migration version.

Do not use this repository's pending migration list as proof that production is missing objects. Always compare the actual live schema before applying any migration.

## Classification Legend

- `RECORDED_AND_MATCHING`: local migration version is recorded in production and the live schema matches the intended effect.
- `LIVE_EQUIVALENT_DIFFERENT_VERSION`: local version is not recorded exactly, but the equivalent schema/function/policy change is already live.
- `PARTIALLY_LIVE`: only part of the local migration's intended effect is live.
- `NOT_LIVE_SAFE_TO_APPLY_LATER`: genuinely absent and potentially safe, but still requires explicit review and approval.
- `NOT_LIVE_PARKED`: intentionally postponed and must not be applied without approval.
- `CONFLICTING`: local SQL conflicts with current live behavior or current business rules.
- `SUPERSEDED`: replaced by a later migration or manual corrective change.
- `UNSAFE_OR_DESTRUCTIVE`: must not be applied without a redesign or manual plan.

## Production Ledger Summary

The production migration ledger includes the following remote versions:

- `20260610192932` - `create_booking_schema`
- `20260610194346` - `booking_rpc_functions`
- `20260610194355` - `booking_read_rpc`
- `20260610201343` - `booking_delivery_insurance`
- `20260610203911` - `booking_driver_gas_fields`
- `20260612114846` - `customer_account_system`
- `20260612114906` - `booking_user_linkage`
- `20260612115702` - `delete_user_account_rpc`
- `20260612205551` - `fix_booking_availability_overlap`
- `20260612214419` - `pay_at_arrival`
- `20260612215908` - `fix_link_bookings_to_user`
- `20260618144659` - `account_dashboard_improvements`
- `20260618150220` - `booking_modify_window_84h`
- `20260618151939` - `cancellation_fee_within_84h`
- `20260618160505` - `admin_portal`
- `20260708083254` - `sentoo_payments`
- `20260708083817` - `car_availability_hints`
- `20260708085814` - `fix_fleet_vehicle_categories`
- `20260708090056` - `restore_standard_daily_rates`
- `20260708101019` - `pricing_discounts`
- `20260709170000` - `booking_concurrency_sentoo_hardening`
- `20260709171000` - `booking_restricted_service_amendments`
- `20260709172000` - `documents_lifecycle_storage`
- `20260710113213` - `launch_rpc_permission_correction`
- `20260710213916` - `booking_checkout_abuse_and_sentoo_idempotency`

Local versions that are live in schema but not recorded under the local version:

- `20260710122509_checkout_hold_30_minutes.sql`
- `20260712161710_add_profile_communication_preferences.sql`
- `20260712201036_email_delivery_idempotency_and_locale.sql`
- `20260716135748_admin_operations_notes_archive.sql`
- `20260716154419_document_deleted_tombstones_customer_read.sql`

## Live Schema Summary

The 2026-07-15 read-only audit verified:

- `bookings.locale` exists with default `'en'`.
- `profiles.marketing_email` exists with default `false`.
- `profiles.marketing_whatsapp` exists with default `false`.
- `email_deliveries` exists with `idempotency_key`, `template_key`, `recipient_email`, `booking_id`, `document_id`, `customer_id`, `status`, `attempts`, `sent_at`, `last_error`, timestamps, and supporting indexes.
- `checkout_hold_minutes = 30` is live in `admin_settings`.
- `customer-documents` storage bucket exists and is private.
- `documents` lifecycle fields exist, including `file_path`, `verified_at`, `verified_by`, `deletion_due_at`, `deleted_at`, and `deletion_reason`.
- Document enum values include `driver_license`, `passport_id`, and `id_card`.
- `private.checkout_hold_claims` exists for checkout-hold abuse protection.
- `bookings.archived_at`, `bookings.archived_by`, and `bookings.archive_reason` exist for admin-only archive visibility.
- `bookings_archive_reason_length_check` limits archive reasons to 1000 characters.
- `booking_internal_notes` exists for admin-only append-only notes, with RLS enabled and no direct `anon`/`authenticated` grants.
- `booking_internal_notes.body` is constrained to non-empty text up to 5000 characters.
- Admin notes/archive indexes exist: `idx_bookings_archived_at`, `idx_bookings_operational_unarchived`, `idx_booking_internal_notes_booking_created`, and `idx_booking_internal_notes_booking_pinned`.
- `get_my_deleted_document_tombstones()` exists as a narrow authenticated RPC for customer-visible deleted document metadata only. It is `SECURITY DEFINER`, fixes `search_path=public`, returns only `document_id`, `document_type`, `verification_status`, `deleted_at`, `uploaded_at`, and `file_name`, and does not expose `file_path`, signed URLs, storage paths, internal deletion reasons, `verified_by`, or admin identifiers.
- Rewards tables are not live.
- `maintenance_job_runs` is not live.
- Cancellation functions still contain 84-hour logic.

## Recent Live-Equivalent Changes Not Recorded Under Local Versions

### `20260710122509_checkout_hold_30_minutes.sql`

- What is live: `admin_settings.checkout_hold_minutes` is set to `{"minutes": 30}`.
- How verified: read-only production schema/settings audit on 2026-07-15.
- Why not blindly apply: the setting is already live; blindly applying pending migrations to make the ledger align could also apply unrelated parked or conflicting migrations.
- Future reconciliation: may be considered later through explicit ledger reconciliation only, not through blanket push.

### `20260712161710_add_profile_communication_preferences.sql`

- What is live: `profiles.marketing_email boolean not null default false` and `profiles.marketing_whatsapp boolean not null default false`.
- How verified: read-only production column audit on 2026-07-15.
- Why not blindly apply: columns already exist with the intended defaults; applying blindly risks executing unrelated pending migrations.
- Future reconciliation: may be considered later through explicit ledger reconciliation only.

### `20260712201036_email_delivery_idempotency_and_locale.sql`

- What is live: `email_deliveries` exists with delivery/idempotency fields and indexes; `bookings.locale text not null default 'en'` exists.
- How verified: read-only production table, column, index, and trigger audit on 2026-07-15.
- Why not blindly apply: the schema effect is already live; reapplying could duplicate indexes/triggers or fail depending on exact SQL and existing state.
- Future reconciliation: may be considered later through explicit ledger reconciliation only.

### `20260716135748_admin_operations_notes_archive.sql`

- What is live: admin archive fields on `bookings`, the admin-only `booking_internal_notes` table, archive/note length constraints, RLS enablement, restrictive grants, and supporting indexes.
- How applied: exact reviewed SQL file executed once with `supabase db query --linked --file supabase/migrations/20260716135748_admin_operations_notes_archive.sql` after explicit approval. No `supabase db push`, parked migration, or migration repair was run.
- How verified: read-only production schema audit on 2026-07-16 confirmed columns, table, RLS, grants, constraints, indexes, and existing booking reads.
- Why not blindly apply later: the schema effect is already live; future reconciliation should compare live schema first and must not run pending migrations as a batch.

## Parked / Conflicting Migrations

DO NOT APPLY these migrations without explicit approval:

### `20260708220000_cancellation_window_48h.sql`

- Classification: `CONFLICTING`
- Reason: conflicts with live 84-hour cancellation/update logic.
- Business status: cancellation policy/contract decision remains unresolved.
- Rule: cancellation policy must remain unchanged until explicitly approved.

### `20260709173000_maintenance_email_queue.sql`

- Classification: `NOT_LIVE_PARKED`
- Reason: `maintenance_job_runs` is not live.
- Additional note: the email delivery portion is superseded by the later narrow email delivery/idempotency migration.
- Rule: do not apply unless the maintenance job design is reviewed and explicitly approved.

### `20260709174000_rewards_ledger_core.sql`

- Classification: `NOT_LIVE_PARKED`
- Reason: rewards tables are not live.
- Business status: rewards product/economics are not approved.
- Rule: do not apply until rewards behavior, accounting, and customer-facing rules are explicitly approved.

## Per-Migration Classification Table

| Migration / live version | Local | Live ledger | Classification | Notes |
|---|---:|---:|---|---|
| `20260610192932 create_booking_schema` | No | Yes | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Live baseline. Missing locally. Do not recreate. |
| `20260610194346 booking_rpc_functions` | No | Yes | `SUPERSEDED` | Live baseline RPCs. Superseded by later local/live RPC versions. |
| `20260610194355 booking_read_rpc` | No | Yes | `SUPERSEDED` | Live baseline read/payment helpers. Superseded by later behavior. |
| `20260610201343 booking_delivery_insurance` | No | Yes | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Live booking delivery/insurance fields. |
| `20260610203911 booking_driver_gas_fields` | No | Yes | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Live driver/gas fields. |
| `20260612120000_customer_account_system.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Local file is a note; live has `customer_account_system`, `booking_user_linkage`, and `delete_user_account_rpc`. |
| `20260613120000_fix_booking_availability_overlap.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Live as `20260612205551 fix_booking_availability_overlap`. |
| `20260613200000_pay_at_arrival.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Live as `20260612214419 pay_at_arrival`. |
| `20260613210000_fix_link_bookings_to_user.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Live as `20260612215908 fix_link_bookings_to_user`. |
| `20260618180000_account_dashboard_improvements.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Live as `20260618144659 account_dashboard_improvements`. |
| `20260618190000_booking_modify_window_84h.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Live functions still contain 84-hour logic. |
| `20260618200000_cancellation_fee_within_84h.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Live cancellation fee columns and 84-hour cancellation logic exist. |
| `20260618210000_admin_portal.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Live as `20260618160505 admin_portal`; admin settings/profile role/fleet fields exist. |
| `20260708100000_sentoo_payments.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Live as `20260708083254 sentoo_payments`; Sentoo columns/functions exist. |
| `20260708103600_car_availability_hints.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Live as `20260708083817 car_availability_hints`. |
| `20260708110000_fix_fleet_vehicle_categories.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Live as `20260708085814 fix_fleet_vehicle_categories`. |
| `20260708110500_restore_standard_daily_rates.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Live as `20260708090056 restore_standard_daily_rates`. |
| `20260708130000_pricing_discounts.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Live as `20260708101019 pricing_discounts`; discount table/booking fields exist. |
| `20260708220000_cancellation_window_48h.sql` | Yes | No | `CONFLICTING` | Do not apply. Conflicts with live 84-hour logic and unresolved policy decision. |
| `20260709170000_booking_concurrency_sentoo_hardening.sql` | Yes | Yes | `RECORDED_AND_MATCHING` | Recorded live. Hold/session columns and RPCs exist. |
| `20260709171000_booking_restricted_service_amendments.sql` | Yes | Yes | `RECORDED_AND_MATCHING` | Recorded live. `booking_change_events` and amendment RPC exist. |
| `20260709172000_documents_lifecycle_storage.sql` | Yes | Yes | `RECORDED_AND_MATCHING` | Recorded live. Document lifecycle, private bucket, and storage policies exist. |
| `20260709173000_maintenance_email_queue.sql` | Yes | No | `NOT_LIVE_PARKED` | Do not apply. `maintenance_job_runs` absent; email delivery portion superseded. |
| `20260709174000_rewards_ledger_core.sql` | Yes | No | `NOT_LIVE_PARKED` | Do not apply. Rewards tables absent and product/economics unapproved. |
| `20260710113213_launch_rpc_permission_correction.sql` | Yes | Yes | `RECORDED_AND_MATCHING` | Recorded live. Sensitive RPC grants corrected. |
| `20260710122509_checkout_hold_30_minutes.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Setting is already live, but ledger does not record local version. |
| `20260710213916_booking_checkout_abuse_and_sentoo_idempotency.sql` | Yes | Yes | `RECORDED_AND_MATCHING` | Recorded live. `private.checkout_hold_claims` and Sentoo checkout claim RPCs exist. |
| `20260712161710_add_profile_communication_preferences.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Columns are live with default `false`, but ledger does not record local version. |
| `20260712201036_email_delivery_idempotency_and_locale.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | `email_deliveries` and `bookings.locale` are live, but ledger does not record local version. |
| `20260716135748_admin_operations_notes_archive.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Applied as exact reviewed SQL via linked query; archive fields, notes table, RLS/grants, constraints, and indexes are live. |
| `20260716154419_document_deleted_tombstones_customer_read.sql` | Yes | No | `LIVE_EQUIVALENT_DIFFERENT_VERSION` | Applied as exact reviewed narrow SQL through the linked query path. The authenticated tombstone RPC is live, existing customer document SELECT policy remains unchanged, storage policies remain unchanged, and the migration must not be blindly reapplied. |

## Canonical Database Change Process Going Forward

1. Every database change requires one narrow migration.
2. SQL must be reviewed before production apply.
3. No blanket `supabase db push`.
4. No `supabase migration repair` without explicit approval.
5. After apply, update:
   - production ledger status
   - this migration reconciliation document
   - application types if needed
6. Parked migrations must be clearly documented.
7. Never assume ledger mismatch means schema is missing.
8. Compare actual live schema before applying any local migration.
9. Production behavior and approved business rules take precedence over stale local SQL.
10. Cancellation policy must remain unchanged until explicitly approved.

## Future Ledger Reconciliation - Not Yet Approved

No immediate production schema change is required.

Ledger repair or baselining may be considered later, but only after exact migration versions are reviewed one by one. No repair command is approved. No migration should be applied merely to make local and remote lists look aligned.

DO NOT RUN - EXAMPLE ONLY:

```bash
supabase migration repair --status applied <version>
```

The exact versions, order, and status must be approved before any command like this is used.

## Operational Source Of Truth

Going forward, use these in this order:

1. Current live production schema and approved business behavior.
2. This reconciliation document.
3. Local migration files, after checking whether they are recorded, live-equivalent, parked, conflicting, or superseded.
4. Future narrow migrations that are reviewed, applied intentionally, and then documented immediately.

## Final Warning

Do not apply pending local migrations as a batch. The pending list contains live-equivalent, parked, conflicting, and superseded work. Applying it blindly can duplicate objects, fail on existing schema, or change approved production behavior.
