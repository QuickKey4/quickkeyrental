-- Admin portal: staff roles + fleet unit metadata

alter table public.profiles
  add column if not exists role text not null default 'customer'
  check (role in ('customer', 'admin'));

create index if not exists idx_profiles_role on public.profiles (role);

alter table public.cars
  add column if not exists license_plate text,
  add column if not exists mileage integer,
  add column if not exists fleet_status text not null default 'available'
  check (fleet_status in ('available', 'reserved', 'on_rental', 'maintenance', 'disabled'));

comment on column public.profiles.role is 'customer | admin — admin users can access /admin portal';
comment on column public.cars.fleet_status is 'Operational fleet status for admin calendar and fleet management';

-- Admin settings (locations, extras config, etc.) — extensible key-value store
create table if not exists public.admin_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.admin_settings enable row level security;

-- Only service role / admin server functions access admin_settings for now
