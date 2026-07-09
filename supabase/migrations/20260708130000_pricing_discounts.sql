-- Scheduled category-based discounts (base prices on cars.daily_price stay unchanged).

create table if not exists public.pricing_discounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  discount_type text not null check (discount_type in ('percent', 'fixed_amount')),
  discount_value numeric not null check (discount_value > 0),
  scope text not null check (scope in ('all', 'compact', 'sedan', 'car')),
  car_id uuid references public.cars (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  constraint pricing_discounts_dates check (ends_at > starts_at),
  constraint pricing_discounts_car_scope check (
    (scope = 'car' and car_id is not null)
    or (scope <> 'car' and car_id is null)
  )
);

create index if not exists pricing_discounts_active_window_idx
  on public.pricing_discounts (starts_at, ends_at)
  where is_active = true;

alter table public.bookings
  add column if not exists applied_discount_id uuid references public.pricing_discounts (id),
  add column if not exists priced_daily_rate numeric;

-- Map car to discount scope (compact = agya units, sedan = yaris).
create or replace function public.car_discount_scope(p_image_url text)
returns text
language sql
immutable
as $$
  select case
    when p_image_url like 'agya%' then 'compact'
    when p_image_url like 'yaris%' then 'sedan'
    else 'other'
  end;
$$;

create or replace function public.pricing_discount_applies_to_car(
  p_discount public.pricing_discounts,
  p_car_id uuid,
  p_image_url text
)
returns boolean
language sql
stable
as $$
  select case p_discount.scope
    when 'all' then true
    when 'compact' then public.car_discount_scope(p_image_url) = 'compact'
    when 'sedan' then public.car_discount_scope(p_image_url) = 'sedan'
    when 'car' then p_discount.car_id = p_car_id
    else false
  end;
$$;

create or replace function public.compute_discounted_daily_price(
  p_base_price numeric,
  p_discount_type text,
  p_discount_value numeric
)
returns numeric
language sql
immutable
as $$
  select greatest(
    0,
    round(
      case p_discount_type
        when 'percent' then p_base_price * (1 - p_discount_value / 100.0)
        when 'fixed_amount' then p_base_price - p_discount_value
        else p_base_price
      end
    )
  );
$$;

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
  v_discount public.pricing_discounts%rowtype;
begin
  select c.daily_price, c.image_url
  into v_base, v_image_url
  from public.cars c
  where c.id = p_car_id;

  if v_base is null then
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

  base_price := v_base;

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

-- Overlap check for admin (same scope, active window intersects).
create or replace function public.pricing_discount_has_overlap(
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
    from public.pricing_discounts d
    where d.is_active = true
      and (p_exclude_id is null or d.id <> p_exclude_id)
      and d.starts_at < p_ends_at
      and d.ends_at > p_starts_at
      and (
        d.scope = p_scope
        or p_scope = 'all'
        or d.scope = 'all'
        or (p_scope = 'car' and d.scope = 'car' and d.car_id = p_car_id)
        or (p_scope = 'compact' and d.scope = 'compact')
        or (p_scope = 'sedan' and d.scope = 'sedan')
      )
  );
$$;

grant execute on function public.resolve_effective_daily_price(uuid, timestamptz) to anon, authenticated;
grant execute on function public.pricing_discount_has_overlap(text, uuid, timestamptz, timestamptz, uuid) to anon, authenticated;

-- Fleet availability returns effective daily price + base for strikethrough UI.
drop function if exists public.get_car_availability(date, date);

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
  left join lateral public.resolve_effective_daily_price(c.id, now()) pricing on true
  left join lateral (
    select max(b.return_date) as blocked_through_date
    from public.bookings b
    where b.car_id = c.id
      and b.status in ('pending', 'confirmed')
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

grant execute on function public.get_car_availability(date, date) to anon, authenticated;

-- Snapshot discount on booking.
drop function if exists public.create_pending_booking(
  uuid, text, text, date, date, time without time zone, time without time zone,
  text, text, text, text, boolean, text, text, numeric, numeric, numeric,
  jsonb, text, text, text, text, numeric, numeric, numeric, numeric,
  text, text, uuid
);

create or replace function public.create_pending_booking(
  p_car_id uuid,
  p_pickup_location text,
  p_return_location text,
  p_pickup_date date,
  p_return_date date,
  p_pickup_time time without time zone,
  p_return_time time without time zone,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_driver_license text,
  p_driver_age_confirmed boolean,
  p_flight_number text,
  p_accommodation text,
  p_subtotal numeric,
  p_extras_total numeric,
  p_total numeric,
  p_extras jsonb default '[]'::jsonb,
  p_delivery_type text default null,
  p_delivery_address text default null,
  p_collection_address text default null,
  p_insurance_option text default null,
  p_deposit_amount numeric default null,
  p_insurance_daily_rate numeric default null,
  p_insurance_total numeric default null,
  p_gas_deposit_amount numeric default null,
  p_additional_driver_name text default null,
  p_additional_driver_license text default null,
  p_user_id uuid default null,
  p_applied_discount_id uuid default null,
  p_priced_daily_rate numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid;
  v_extra jsonb;
  v_days integer;
  v_user_id uuid;
begin
  if p_return_date < p_pickup_date then
    raise exception 'Return date must be on or after pickup date';
  end if;

  if not p_driver_age_confirmed then
    raise exception 'Driver age must be confirmed';
  end if;

  v_user_id := p_user_id;
  if v_user_id is null then
    select id into v_user_id
    from public.profiles
    where lower(email) = lower(p_guest_email)
    limit 1;
  end if;

  if public.car_has_booking_conflict(p_car_id, p_pickup_date, p_return_date) then
    raise exception 'That car is no longer available for these dates.';
  end if;

  insert into public.bookings (
    car_id,
    user_id,
    guest_name,
    guest_email,
    guest_phone,
    pickup_location,
    return_location,
    pickup_date,
    return_date,
    pickup_time,
    return_time,
    flight_number,
    accommodation,
    driver_license_number,
    driver_age_confirmed,
    status,
    payment_status,
    subtotal,
    extras_total,
    total,
    delivery_type,
    delivery_address,
    collection_address,
    insurance_option,
    deposit_amount,
    insurance_daily_rate,
    insurance_total,
    gas_deposit_amount,
    additional_driver_name,
    additional_driver_license,
    applied_discount_id,
    priced_daily_rate
  )
  values (
    p_car_id,
    v_user_id,
    p_guest_name,
    p_guest_email,
    p_guest_phone,
    p_pickup_location,
    p_return_location,
    p_pickup_date,
    p_return_date,
    p_pickup_time,
    p_return_time,
    nullif(p_flight_number, ''),
    nullif(p_accommodation, ''),
    p_driver_license,
    p_driver_age_confirmed,
    'pending',
    'unpaid',
    p_subtotal,
    p_extras_total,
    p_total,
    p_delivery_type,
    p_delivery_address,
    p_collection_address,
    p_insurance_option,
    p_deposit_amount,
    p_insurance_daily_rate,
    p_insurance_total,
    p_gas_deposit_amount,
    p_additional_driver_name,
    p_additional_driver_license,
    p_applied_discount_id,
    p_priced_daily_rate
  )
  returning id into v_booking_id;

  v_days := greatest(1, p_return_date - p_pickup_date);

  for v_extra in
    select * from jsonb_array_elements(coalesce(p_extras, '[]'::jsonb))
  loop
    insert into public.booking_extras (
      booking_id,
      extra_name,
      price_per_day,
      quantity,
      total
    )
    values (
      v_booking_id,
      v_extra ->> 'name',
      coalesce((v_extra ->> 'pricePerDay')::numeric, 0),
      coalesce((v_extra ->> 'quantity')::integer, 1),
      coalesce((v_extra ->> 'pricePerDay')::numeric, 0)
        * coalesce((v_extra ->> 'quantity')::integer, 1)
        * v_days
    );
  end loop;

  return v_booking_id;
end;
$$;

grant execute on function public.create_pending_booking(
  uuid, text, text, date, date, time without time zone, time without time zone,
  text, text, text, text, boolean, text, text, numeric, numeric, numeric,
  jsonb, text, text, text, text, numeric, numeric, numeric, numeric,
  text, text, uuid, uuid, numeric
) to anon, authenticated;
