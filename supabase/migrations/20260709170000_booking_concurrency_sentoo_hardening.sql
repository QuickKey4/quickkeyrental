-- Booking/Sentoo hardening:
-- - add per-car transaction locks to every live create_pending_booking overload
-- - route legacy overloads through the canonical 31-argument implementation
-- - add non-destructive pending expiry/confirmation metadata
-- - keep Sentoo confirmation idempotent and conflict-aware

alter table public.bookings
  add column if not exists pending_expires_at timestamptz,
  add column if not exists expired_at timestamptz,
  add column if not exists expiration_reason text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmation_source text,
  add column if not exists checkout_session_id text,
  add column if not exists hold_started_at timestamptz,
  add column if not exists primary_driver_date_of_birth date,
  add column if not exists additional_driver_date_of_birth date;

create index if not exists idx_bookings_pending_expiry
  on public.bookings (pending_expires_at)
  where status = 'pending'
    and payment_status = 'unpaid'
    and pending_expires_at is not null;

create index if not exists idx_bookings_checkout_session_active
  on public.bookings (checkout_session_id, pending_expires_at)
  where status = 'pending'
    and payment_status = 'unpaid'
    and checkout_session_id is not null
    and expired_at is null;

insert into public.admin_settings (key, value)
values ('checkout_hold_minutes', '{"minutes": 15}'::jsonb)
on conflict (key) do nothing;

update public.bookings
set pending_expires_at = coalesce(created_at, now()) + interval '15 minutes'
where status = 'pending'
  and payment_status = 'unpaid'
  and pending_expires_at is null;

create or replace function public.checkout_hold_interval()
returns interval
language sql
stable
security definer
set search_path = public
as $$
  select make_interval(
    mins => greatest(
      1,
      least(
        120,
        coalesce(
          (
            select nullif(value ->> 'minutes', '')::integer
            from public.admin_settings
            where key = 'checkout_hold_minutes'
            limit 1
          ),
          15
        )
      )
    )
  );
$$;

revoke execute on function public.checkout_hold_interval() from public;
grant execute on function public.checkout_hold_interval() to service_role;

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
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
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
  );
$$;

comment on function public.car_has_booking_conflict(uuid, date, date, uuid) is
  'True when the car has an overlapping confirmed booking or an active unexpired pending checkout hold.';

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

create or replace function public.create_checkout_hold(
  p_checkout_session_id text,
  p_car_id uuid,
  p_pickup_date date,
  p_return_date date,
  p_pickup_time time without time zone,
  p_return_time time without time zone,
  p_delivery_type text,
  p_delivery_address text,
  p_collection_address text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.bookings%rowtype;
  v_booking_id uuid;
  v_hold_expires_at timestamptz;
  v_placeholder_email text;
begin
  if nullif(trim(p_checkout_session_id), '') is null then
    raise exception 'Checkout session is required';
  end if;

  if p_return_date < p_pickup_date then
    raise exception 'Return date must be on or after pickup date';
  end if;

  if nullif(trim(p_delivery_address), '') is null then
    raise exception 'Delivery address is required';
  end if;

  if nullif(trim(p_collection_address), '') is null then
    raise exception 'Collection address is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('checkout:' || p_checkout_session_id, 0));
  perform pg_advisory_xact_lock(hashtextextended(p_car_id::text, 0));

  select * into v_existing
  from public.bookings b
  where b.checkout_session_id = p_checkout_session_id
    and b.status = 'pending'
    and b.payment_status = 'unpaid'
    and b.pending_expires_at > now()
    and b.expired_at is null
    and b.car_id = p_car_id
    and b.pickup_date = p_pickup_date
    and b.return_date = p_return_date
    and b.pickup_time = p_pickup_time
    and b.return_time = p_return_time
  order by b.created_at desc
  limit 1
  for update;

  if found then
    update public.bookings
    set
      delivery_type = p_delivery_type,
      delivery_address = trim(p_delivery_address),
      collection_address = trim(p_collection_address)
    where id = v_existing.id;

    return jsonb_build_object(
      'bookingId', v_existing.id,
      'holdExpiresAt', v_existing.pending_expires_at,
      'reused', true
    );
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.car_id = p_car_id
      and coalesce(b.checkout_session_id, '') <> p_checkout_session_id
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
        p_pickup_date,
        p_return_date
      )
  ) then
    raise exception 'That car is no longer available for these dates.';
  end if;

  v_booking_id := gen_random_uuid();
  v_hold_expires_at := now() + public.checkout_hold_interval();
  v_placeholder_email := 'hold-' || replace(v_booking_id::text, '-', '') || '@quickkey.local';

  insert into public.bookings (
    id,
    car_id,
    guest_name,
    guest_email,
    guest_phone,
    pickup_location,
    return_location,
    pickup_date,
    return_date,
    pickup_time,
    return_time,
    driver_age_confirmed,
    status,
    payment_status,
    subtotal,
    extras_total,
    total,
    delivery_type,
    delivery_address,
    collection_address,
    checkout_session_id,
    hold_started_at,
    pending_expires_at
  )
  values (
    v_booking_id,
    p_car_id,
    'Checkout hold',
    v_placeholder_email,
    '00000000',
    p_delivery_type,
    'collection',
    p_pickup_date,
    p_return_date,
    p_pickup_time,
    p_return_time,
    false,
    'pending',
    'unpaid',
    0,
    0,
    0,
    p_delivery_type,
    trim(p_delivery_address),
    trim(p_collection_address),
    p_checkout_session_id,
    now(),
    v_hold_expires_at
  );

  update public.bookings b
  set
    expired_at = now(),
    expiration_reason = 'checkout_hold_replaced'
  where b.checkout_session_id = p_checkout_session_id
    and b.id <> v_booking_id
    and b.status = 'pending'
    and b.payment_status = 'unpaid'
    and b.expired_at is null;

  return jsonb_build_object(
    'bookingId', v_booking_id,
    'holdExpiresAt', v_hold_expires_at,
    'reused', false
  );
end;
$$;

create or replace function public.finalize_checkout_hold(
  p_booking_id uuid,
  p_checkout_session_id text,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_driver_license text,
  p_driver_age_confirmed boolean,
  p_primary_driver_date_of_birth date,
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
  p_additional_driver_date_of_birth date default null,
  p_applied_discount_id uuid default null,
  p_priced_daily_rate numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_extra jsonb;
  v_days integer;
  v_user_id uuid;
begin
  if nullif(trim(p_checkout_session_id), '') is null then
    raise exception 'Checkout session is required';
  end if;

  if not p_driver_age_confirmed then
    raise exception 'Driver age must be confirmed';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('checkout:' || p_checkout_session_id, 0));

  select * into v_booking
  from public.bookings
  where id = p_booking_id
    and checkout_session_id = p_checkout_session_id
  for update;

  if not found then
    raise exception 'Checkout hold not found';
  end if;

  if v_booking.status <> 'pending' or v_booking.payment_status <> 'unpaid' then
    raise exception 'Checkout hold is no longer editable';
  end if;

  if v_booking.expired_at is not null or v_booking.pending_expires_at <= now() then
    raise exception 'Your reserved car hold has expired.';
  end if;

  if v_booking.sentoo_transaction_id is not null
    or coalesce(v_booking.sentoo_status, '') <> ''
    or coalesce(v_booking.payment_provider, 'none') <> 'none' then
    raise exception 'Checkout payment has already started.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_booking.car_id::text, 0));

  if public.car_has_booking_conflict(
    v_booking.car_id,
    v_booking.pickup_date,
    v_booking.return_date,
    v_booking.id
  ) then
    raise exception 'That car is no longer available for these dates.';
  end if;

  select id into v_user_id
  from public.profiles
  where lower(email) = lower(p_guest_email)
  limit 1;

  update public.bookings
  set
    user_id = v_user_id,
    guest_name = p_guest_name,
    guest_email = p_guest_email,
    guest_phone = p_guest_phone,
    driver_license_number = p_driver_license,
    driver_age_confirmed = p_driver_age_confirmed,
    primary_driver_date_of_birth = p_primary_driver_date_of_birth,
    flight_number = nullif(p_flight_number, ''),
    accommodation = nullif(p_accommodation, ''),
    subtotal = p_subtotal,
    extras_total = p_extras_total,
    total = p_total,
    delivery_type = p_delivery_type,
    delivery_address = p_delivery_address,
    collection_address = p_collection_address,
    insurance_option = p_insurance_option,
    deposit_amount = p_deposit_amount,
    insurance_daily_rate = p_insurance_daily_rate,
    insurance_total = p_insurance_total,
    gas_deposit_amount = p_gas_deposit_amount,
    additional_driver_name = nullif(p_additional_driver_name, ''),
    additional_driver_license = nullif(p_additional_driver_license, ''),
    additional_driver_date_of_birth = p_additional_driver_date_of_birth,
    applied_discount_id = p_applied_discount_id,
    priced_daily_rate = p_priced_daily_rate
  where id = p_booking_id;

  delete from public.booking_extras
  where booking_id = p_booking_id;

  v_days := greatest(1, v_booking.return_date - v_booking.pickup_date);

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
      p_booking_id,
      v_extra ->> 'name',
      coalesce((v_extra ->> 'pricePerDay')::numeric, 0),
      coalesce((v_extra ->> 'quantity')::integer, 1),
      coalesce((v_extra ->> 'pricePerDay')::numeric, 0)
        * coalesce((v_extra ->> 'quantity')::integer, 1)
        * v_days
    );
  end loop;

  return p_booking_id;
end;
$$;

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
  p_primary_driver_date_of_birth date,
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
  p_additional_driver_date_of_birth date default null,
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

  -- Serialise booking creation per car only. Unrelated cars can proceed in
  -- parallel, while same-car attempts re-run the conflict check after lock.
  perform pg_advisory_xact_lock(hashtextextended(p_car_id::text, 0));

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
    primary_driver_date_of_birth,
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
    additional_driver_date_of_birth,
    applied_discount_id,
    priced_daily_rate,
    pending_expires_at
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
    p_primary_driver_date_of_birth,
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
    nullif(p_additional_driver_license, ''),
    p_additional_driver_date_of_birth,
    p_applied_discount_id,
    p_priced_daily_rate,
    now() + public.checkout_hold_interval()
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
  p_extras jsonb default '[]'::jsonb
)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.create_pending_booking(
    p_car_id, p_pickup_location, p_return_location, p_pickup_date, p_return_date,
    p_pickup_time, p_return_time, p_guest_name, p_guest_email, p_guest_phone,
    p_driver_license, p_driver_age_confirmed, null, p_flight_number, p_accommodation,
    p_subtotal, p_extras_total, p_total, p_extras,
    null, null, null, null, null, null, null, null, null, null, null, null, null, null
  );
$$;

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
  p_insurance_total numeric default null
)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.create_pending_booking(
    p_car_id, p_pickup_location, p_return_location, p_pickup_date, p_return_date,
    p_pickup_time, p_return_time, p_guest_name, p_guest_email, p_guest_phone,
    p_driver_license, p_driver_age_confirmed, null, p_flight_number, p_accommodation,
    p_subtotal, p_extras_total, p_total, p_extras, p_delivery_type,
    p_delivery_address, p_collection_address, p_insurance_option,
    p_deposit_amount, p_insurance_daily_rate, p_insurance_total,
    null, null, null, null, null, null, null
  );
$$;

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
  p_additional_driver_license text default null
)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.create_pending_booking(
    p_car_id, p_pickup_location, p_return_location, p_pickup_date, p_return_date,
    p_pickup_time, p_return_time, p_guest_name, p_guest_email, p_guest_phone,
    p_driver_license, p_driver_age_confirmed, null, p_flight_number, p_accommodation,
    p_subtotal, p_extras_total, p_total, p_extras, p_delivery_type,
    p_delivery_address, p_collection_address, p_insurance_option,
    p_deposit_amount, p_insurance_daily_rate, p_insurance_total,
    p_gas_deposit_amount, p_additional_driver_name, p_additional_driver_license,
    null, null, null, null
  );
$$;

create or replace function public.confirm_booking_sentoo_payment(
  p_booking_id uuid,
  p_transaction_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  select * into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  if v_booking.payment_status = 'paid' then
    return;
  end if;

  if p_transaction_id is not null
    and v_booking.sentoo_transaction_id is not null
    and v_booking.sentoo_transaction_id <> p_transaction_id then
    raise exception 'Sentoo transaction does not match booking';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_booking.car_id::text, 0));

  if public.car_has_booking_conflict(
    v_booking.car_id,
    v_booking.pickup_date,
    v_booking.return_date,
    v_booking.id
  ) then
    raise exception 'That car is no longer available for these dates.';
  end if;

  update public.bookings
  set
    status = 'confirmed',
    payment_status = 'paid',
    payment_provider = 'sentoo',
    sentoo_status = 'success',
    sentoo_transaction_id = coalesce(p_transaction_id, sentoo_transaction_id),
    confirmed_at = coalesce(confirmed_at, now()),
    confirmation_source = coalesce(confirmation_source, 'sentoo'),
    pending_expires_at = null,
    expired_at = null,
    expiration_reason = null
  where
    id = p_booking_id
    and status = 'pending'
    and payment_status is distinct from 'paid';
end;
$$;

create or replace function public.expire_abandoned_pending_bookings(
  p_standard_hold interval default interval '15 minutes',
  p_sentoo_hold interval default interval '15 minutes'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired integer := 0;
begin
  update public.bookings b
  set
    status = 'cancelled',
    expired_at = now(),
    expiration_reason = case
      when b.payment_provider = 'sentoo' then 'sentoo_unpaid_hold_expired'
      else 'unpaid_hold_expired'
    end
  where b.status = 'pending'
    and b.payment_status = 'unpaid'
    and b.confirmed_at is null
    and coalesce(b.sentoo_status, '') <> 'success'
    and (
      (b.payment_provider = 'sentoo' and b.created_at < now() - p_sentoo_hold)
      or (b.payment_provider <> 'sentoo' and b.created_at < now() - p_standard_hold)
      or (b.pending_expires_at is not null and b.pending_expires_at < now())
    );

  get diagnostics v_expired = row_count;
  return v_expired;
end;
$$;

revoke execute on function public.create_pending_booking(
  uuid, text, text, date, date, time without time zone, time without time zone,
  text, text, text, text, boolean, text, text, numeric, numeric, numeric, jsonb
) from public;
revoke execute on function public.create_pending_booking(
  uuid, text, text, date, date, time without time zone, time without time zone,
  text, text, text, text, boolean, text, text, numeric, numeric, numeric,
  jsonb, text, text, text, text, numeric, numeric, numeric
) from public;
revoke execute on function public.create_pending_booking(
  uuid, text, text, date, date, time without time zone, time without time zone,
  text, text, text, text, boolean, text, text, numeric, numeric, numeric,
  jsonb, text, text, text, text, numeric, numeric, numeric, numeric, text, text
) from public;
revoke execute on function public.create_pending_booking(
  uuid, text, text, date, date, time without time zone, time without time zone,
  text, text, text, text, boolean, text, text, numeric, numeric, numeric,
  jsonb, text, text, text, text, numeric, numeric, numeric, numeric,
  text, text, uuid, uuid, numeric
) from public;
revoke execute on function public.create_pending_booking(
  uuid, text, text, date, date, time without time zone, time without time zone,
  text, text, text, text, boolean, date, text, text, numeric, numeric, numeric,
  jsonb, text, text, text, text, numeric, numeric, numeric, numeric,
  text, text, date, uuid, uuid, numeric
) from public;
revoke execute on function public.confirm_booking_sentoo_payment(uuid, text) from public;
revoke execute on function public.expire_abandoned_pending_bookings(interval, interval) from public;
revoke execute on function public.create_checkout_hold(
  text, uuid, date, date, time without time zone, time without time zone,
  text, text, text
) from public;
revoke execute on function public.finalize_checkout_hold(
  uuid, text, text, text, text, text, boolean, date, text, text, numeric, numeric,
  numeric, jsonb, text, text, text, text, numeric, numeric, numeric, numeric,
  text, text, date, uuid, numeric
) from public;

grant execute on function public.create_pending_booking(
  uuid, text, text, date, date, time without time zone, time without time zone,
  text, text, text, text, boolean, text, text, numeric, numeric, numeric, jsonb
) to anon, authenticated;
grant execute on function public.create_pending_booking(
  uuid, text, text, date, date, time without time zone, time without time zone,
  text, text, text, text, boolean, text, text, numeric, numeric, numeric,
  jsonb, text, text, text, text, numeric, numeric, numeric
) to anon, authenticated;
grant execute on function public.create_pending_booking(
  uuid, text, text, date, date, time without time zone, time without time zone,
  text, text, text, text, boolean, text, text, numeric, numeric, numeric,
  jsonb, text, text, text, text, numeric, numeric, numeric, numeric, text, text
) to anon, authenticated;
grant execute on function public.create_pending_booking(
  uuid, text, text, date, date, time without time zone, time without time zone,
  text, text, text, text, boolean, text, text, numeric, numeric, numeric,
  jsonb, text, text, text, text, numeric, numeric, numeric, numeric,
  text, text, uuid, uuid, numeric
) to anon, authenticated;
grant execute on function public.create_pending_booking(
  uuid, text, text, date, date, time without time zone, time without time zone,
  text, text, text, text, boolean, date, text, text, numeric, numeric, numeric,
  jsonb, text, text, text, text, numeric, numeric, numeric, numeric,
  text, text, date, uuid, uuid, numeric
) to anon, authenticated;
grant execute on function public.confirm_booking_sentoo_payment(uuid, text) to service_role;
grant execute on function public.expire_abandoned_pending_bookings(interval, interval) to service_role;
grant execute on function public.create_checkout_hold(
  text, uuid, date, date, time without time zone, time without time zone,
  text, text, text
) to service_role;
grant execute on function public.finalize_checkout_hold(
  uuid, text, text, text, text, text, boolean, date, text, text, numeric, numeric,
  numeric, jsonb, text, text, text, text, numeric, numeric, numeric, numeric,
  text, text, date, uuid, numeric
) to service_role;
