-- Rewards ledger/core foundation.

create table if not exists public.reward_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.reward_config (key, value)
values
  ('earning', '{"points_per_currency_unit": 1}'::jsonb),
  ('review_bonus', '{"points": 250}'::jsonb),
  (
    'redemption_tiers',
    '[{"points":500,"credit":10},{"points":1000,"credit":20},{"points":2500,"credit":50},{"points":5000,"credit":100}]'::jsonb
  )
on conflict (key) do nothing;

alter table public.reward_config enable row level security;

create table if not exists public.reward_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  customer_email text,
  booking_id uuid references public.bookings(id) on delete set null,
  transaction_type text not null
    check (transaction_type in (
      'rental_earned',
      'review_bonus',
      'referral_bonus',
      'redemption',
      'refund_reversal',
      'cancellation_reversal',
      'admin_adjustment',
      'historical_credit'
    )),
  points_delta integer not null,
  reason text not null,
  status text not null default 'posted'
    check (status in ('pending', 'posted', 'voided')),
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_reward_transactions_customer
  on public.reward_transactions (customer_id, created_at desc);

create index if not exists idx_reward_transactions_email
  on public.reward_transactions (lower(customer_email), created_at desc)
  where customer_email is not null;

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  points integer not null check (points > 0),
  credit_amount numeric not null check (credit_amount > 0),
  status text not null default 'reserved'
    check (status in ('reserved', 'applied', 'cancelled', 'reversed')),
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

alter table public.reward_transactions enable row level security;
alter table public.reward_redemptions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reward_config'
      and policyname = 'Authenticated users can read reward config'
  ) then
    create policy "Authenticated users can read reward config"
      on public.reward_config
      for select
      to authenticated
      using (true);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reward_transactions'
      and policyname = 'Users can read own reward transactions'
  ) then
    create policy "Users can read own reward transactions"
      on public.reward_transactions
      for select
      to authenticated
      using (customer_id = auth.uid());
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reward_redemptions'
      and policyname = 'Users can read own reward redemptions'
  ) then
    create policy "Users can read own reward redemptions"
      on public.reward_redemptions
      for select
      to authenticated
      using (customer_id = auth.uid());
  end if;
end;
$$;
