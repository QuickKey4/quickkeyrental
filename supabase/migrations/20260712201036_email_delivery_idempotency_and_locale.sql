-- Email delivery idempotency/logging and customer email locale.
-- Narrow launch migration only. Do not combine with parked broad migrations.

create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  locale text not null default 'en',
  recipient_email text not null,
  booking_id uuid references public.bookings(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  customer_id uuid references public.profiles(id) on delete set null,
  idempotency_key text not null unique,
  status text not null default 'queued'
    check (status in ('queued', 'sending', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.email_deliveries
  add column if not exists template_key text,
  add column if not exists locale text not null default 'en',
  add column if not exists recipient_email text,
  add column if not exists booking_id uuid references public.bookings(id) on delete set null,
  add column if not exists document_id uuid references public.documents(id) on delete set null,
  add column if not exists customer_id uuid references public.profiles(id) on delete set null,
  add column if not exists idempotency_key text,
  add column if not exists status text not null default 'queued',
  add column if not exists attempts integer not null default 0,
  add column if not exists sent_at timestamptz,
  add column if not exists last_error text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists next_attempt_at timestamptz not null default now(),
  add column if not exists payload jsonb not null default '{}'::jsonb;

update public.email_deliveries
set
  locale = coalesce(locale, 'en'),
  status = coalesce(status, 'queued'),
  attempts = coalesce(attempts, 0),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now()),
  next_attempt_at = coalesce(next_attempt_at, now()),
  payload = coalesce(payload, '{}'::jsonb);

alter table public.email_deliveries
  alter column template_key set not null,
  alter column locale set not null,
  alter column recipient_email set not null,
  alter column idempotency_key set not null,
  alter column status set not null,
  alter column attempts set not null,
  alter column created_at set not null,
  alter column updated_at set not null,
  alter column next_attempt_at set not null,
  alter column payload set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_deliveries_status_check'
      and conrelid = 'public.email_deliveries'::regclass
  ) then
    alter table public.email_deliveries
      add constraint email_deliveries_status_check
      check (status in ('queued', 'sending', 'sent', 'failed', 'skipped'));
  end if;
end;
$$;

create unique index if not exists email_deliveries_idempotency_key_key
  on public.email_deliveries (idempotency_key);

create index if not exists idx_email_deliveries_queue
  on public.email_deliveries (status, next_attempt_at);

create index if not exists idx_email_deliveries_booking_id
  on public.email_deliveries (booking_id);

create index if not exists idx_email_deliveries_document_id
  on public.email_deliveries (document_id);

alter table public.email_deliveries enable row level security;

alter table public.bookings
  add column if not exists locale text not null default 'en'
    check (locale in ('en', 'nl', 'es', 'pap', 'pt'));

create or replace function public.set_email_deliveries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_email_deliveries_updated_at on public.email_deliveries;
create trigger trg_email_deliveries_updated_at
before update on public.email_deliveries
for each row execute function public.set_email_deliveries_updated_at();
