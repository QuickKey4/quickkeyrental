-- Fix booking availability: block cars only for overlapping rental periods.
--
-- Bug: Some deployments treated any existing booking as making a car unavailable
-- indefinitely, instead of checking date-range overlap.
--
-- Correct rule (inclusive rental days):
--   periods overlap when existing.pickup_date <= requested.return_date
--                    AND existing.return_date >= requested.pickup_date
--
-- Only pending + confirmed bookings block availability. Cancelled bookings are ignored.
--
-- Apply later via Supabase CLI or Dashboard SQL editor:
--   supabase db push
--   — or paste this file into the SQL editor on project ipcafhvrderkivpqtnpb

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.rental_periods_overlap(
  p_start_a date,
  p_end_a date,
  p_start_b date,
  p_end_b date
)
returns boolean
language sql
immutable
parallel safe
as $$
  select p_start_a <= p_end_b and p_end_a >= p_start_b;
$$;

comment on function public.rental_periods_overlap(date, date, date, date) is
  'True when two inclusive rental periods share at least one day.';

create or replace function public.car_has_booking_conflict(
  p_car_id uuid,
  p_pickup date,
  p_return date,
  p_exclude_booking_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    where b.car_id = p_car_id
      and b.status in ('pending', 'confirmed')
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
      and public.rental_periods_overlap(
        b.pickup_date,
        b.return_date,
        p_pickup,
        p_return
      )
  );
$$;

comment on function public.car_has_booking_conflict(uuid, date, date, uuid) is
  'True when the car already has a pending/confirmed booking overlapping the requested period.';

create index if not exists idx_bookings_car_active_dates
  on public.bookings (car_id, pickup_date, return_date)
  where status in ('pending', 'confirmed');

-- ---------------------------------------------------------------------------
-- Fleet availability for a requested period
-- ---------------------------------------------------------------------------

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
  seats integer,
  bags integer,
  transmission text,
  fuel_type text,
  ac boolean,
  image_url text,
  is_active boolean,
  created_at timestamptz,
  available boolean
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
    c.daily_price,
    c.seats,
    c.bags,
    c.transmission,
    c.fuel_type,
    c.ac,
    c.image_url,
    c.is_active,
    c.created_at,
    not public.car_has_booking_conflict(c.id, p_pickup, p_return) as available
  from public.cars c
  where c.is_active = true
  order by c.created_at;
$$;

comment on function public.get_car_availability(date, date) is
  'Returns active fleet cars and whether each is free for the requested inclusive rental period.';

grant execute on function public.rental_periods_overlap(date, date, date, date) to anon, authenticated;
grant execute on function public.car_has_booking_conflict(uuid, date, date, uuid) to anon, authenticated;
grant execute on function public.get_car_availability(date, date) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Booking creation — reuse conflict helper (full function body preserved)
-- ---------------------------------------------------------------------------

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
  p_user_id uuid default null
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
    additional_driver_license
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
    nullif(p_additional_driver_name, ''),
    nullif(p_additional_driver_license, '')
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
  uuid, text, text, date, date, time, time, text, text, text, text, boolean,
  text, text, numeric, numeric, numeric, jsonb, text, text, text, text,
  numeric, numeric, numeric, numeric, text, text, uuid
) to anon, authenticated;
