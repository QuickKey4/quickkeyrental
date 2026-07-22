-- Reusable maintenance/email queue foundation.

create table if not exists public.maintenance_job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'success', 'failed')),
  processed_count integer not null default 0,
  error_message text
);

create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  locale text not null default 'en',
  recipient_email text not null,
  booking_id uuid references public.bookings(id) on delete set null,
  customer_id uuid references public.profiles(id) on delete set null,
  idempotency_key text not null unique,
  status text not null default 'queued'
    check (status in ('queued', 'sending', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_deliveries_queue
  on public.email_deliveries (status, next_attempt_at);

alter table public.maintenance_job_runs enable row level security;
alter table public.email_deliveries enable row level security;
