-- Absolute daily rates for date windows (high season, etc.).
-- Existing bookings keep priced_daily_rate; only new pricing uses these periods.

create table if not exists public.pricing_rate_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  daily_price numeric not null check (daily_price > 0),
  scope text not null check (scope in ('all', 'compact', 'sedan', 'car')),
  car_id uuid references public.cars (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  constraint pricing_rate_periods_dates check (ends_at > starts_at),
  constraint pricing_rate_periods_car_scope check (
    (scope = 'car' and car_id is not null)
    or (scope <> 'car' and car_id is null)
  )
);

create index if not exists pricing_rate_periods_active_window_idx
  on public.pricing_rate_periods (starts_at, ends_at)
  where is_active = true;

alter table public.pricing_rate_periods enable row level security;

create or replace function public.pricing_rate_period_applies_to_car(
  p_period public.pricing_rate_periods,
  p_car_id uuid,
  p_image_url text
)
returns boolean
language sql
stable
as $$
  select case p_period.scope
    when 'all' then true
    when 'compact' then public.car_discount_scope(p_image_url) = 'compact'
    when 'sedan' then public.car_discount_scope(p_image_url) = 'sedan'
    when 'car' then p_period.car_id = p_car_id
    else false
  end;
$$;

create or replace function public.pricing_rate_period_has_overlap(
  p_scope text,
  p_car_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_exclude_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pricing_rate_periods r
    where r.is_active = true
      and (p_exclude_id is null or r.id <> p_exclude_id)
      and r.starts_at < p_ends_at
      and r.ends_at > p_starts_at
      and (
        r.scope = p_scope
        or p_scope = 'all'
        or r.scope = 'all'
        or (p_scope = 'car' and r.scope = 'car' and r.car_id = p_car_id)
        or (p_scope = 'compact' and r.scope = 'compact')
        or (p_scope = 'sedan' and r.scope = 'sedan')
      )
  );
$$;

-- Rate periods win over discounts. p_at should be the rental pickup moment.
create or replace function public.resolve_effective_daily_price(
  p_car_id uuid,
  p_at timestamptz default now()
)
returns table (
  base_price numeric,
  effective_price numeric,
  discount_id uuid,
  discount_label text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_base numeric;
  v_image_url text;
  v_period public.pricing_rate_periods%rowtype;
  v_discount public.pricing_discounts%rowtype;
begin
  select c.daily_price, c.image_url
  into v_base, v_image_url
  from public.cars c
  where c.id = p_car_id;

  if v_base is null then
    return;
  end if;

  base_price := v_base;

  select r.*
  into v_period
  from public.pricing_rate_periods r
  where r.is_active = true
    and p_at >= r.starts_at
    and p_at < r.ends_at
    and public.pricing_rate_period_applies_to_car(r, p_car_id, v_image_url)
  order by r.created_at desc
  limit 1;

  if v_period.id is not null then
    effective_price := round(v_period.daily_price);
    discount_id := null;
    discount_label := v_period.name;
    return next;
    return;
  end if;

  select d.*
  into v_discount
  from public.pricing_discounts d
  where d.is_active = true
    and p_at >= d.starts_at
    and p_at < d.ends_at
    and public.pricing_discount_applies_to_car(d, p_car_id, v_image_url)
  order by d.created_at desc
  limit 1;

  if v_discount.id is null then
    effective_price := v_base;
    discount_id := null;
    discount_label := null;
    return next;
    return;
  end if;

  effective_price := public.compute_discounted_daily_price(
    v_base,
    v_discount.discount_type,
    v_discount.discount_value
  );
  discount_id := v_discount.id;
  discount_label := v_discount.name;
  return next;
end;
$$;

-- Price availability by rental pickup date, not "now".
create or replace function public.get_car_availability(
  p_pickup date,
  p_return date
)
returns table (
  id uuid,
  name text,
  category text,
  year integer,
  daily_price numeric,
  base_daily_price numeric,
  discount_id uuid,
  discount_label text,
  seats integer,
  bags integer,
  transmission text,
  fuel_type text,
  ac boolean,
  image_url text,
  is_active boolean,
  created_at timestamptz,
  available boolean,
  blocked_through_date date,
  next_available_date date
)
language sql
security definer
set search_path = public
as $$
  select
    c.id,
    c.name,
    c.category,
    c.year,
    coalesce(pricing.effective_price, c.daily_price) as daily_price,
    c.daily_price as base_daily_price,
    pricing.discount_id,
    pricing.discount_label,
    c.seats,
    c.bags,
    c.transmission,
    c.fuel_type,
    c.ac,
    c.image_url,
    c.is_active,
    c.created_at,
    not public.car_has_booking_conflict(c.id, p_pickup, p_return) as available,
    conflicts.blocked_through_date,
    case
      when conflicts.blocked_through_date is null then null
      else (conflicts.blocked_through_date + 1)::date
    end as next_available_date
  from public.cars c
  left join lateral public.resolve_effective_daily_price(
    c.id,
    (p_pickup::timestamp + time '12:00') at time zone 'America/Curacao'
  ) pricing on true
  left join lateral (
    select max(b.return_date) as blocked_through_date
    from public.bookings b
    where b.car_id = c.id
      and (
        b.status = 'confirmed'
        or (
          b.status = 'pending'
          and b.payment_status = 'unpaid'
          and b.pending_expires_at > now()
          and b.expired_at is null
        )
      )
      and public.rental_periods_overlap(
        b.pickup_date,
        b.return_date,
        p_pickup,
        p_return
      )
  ) conflicts on true
  where c.is_active = true
  order by c.created_at;
$$;

grant execute on function public.pricing_rate_period_has_overlap(text, uuid, timestamptz, timestamptz, uuid)
  to anon, authenticated;
grant execute on function public.resolve_effective_daily_price(uuid, timestamptz)
  to anon, authenticated;
grant execute on function public.get_car_availability(date, date)
  to anon, authenticated;
