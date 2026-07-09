-- Free cancellation / modify window: 84h -> 48h before pickup.

create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_accept_cancellation_fee boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_booking public.bookings%rowtype;
  v_updated integer;
  v_pickup timestamptz;
  v_hours numeric;
  v_fee numeric := 0;
  v_days integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(p.email, u.email)
  into v_email
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_user_id;

  select * into v_booking
  from public.bookings b
  where b.id = p_booking_id
    and b.status in ('pending', 'confirmed')
    and (
      b.user_id = v_user_id
      or (v_email is not null and lower(b.guest_email) = lower(v_email))
    );

  if not found then
    raise exception 'Booking not found or cannot be cancelled';
  end if;

  v_pickup := (v_booking.pickup_date + coalesce(v_booking.pickup_time, time '10:00'))::timestamp at time zone 'America/Curacao';
  v_hours := extract(epoch from (v_pickup - now())) / 3600.0;

  if v_hours <= 0 then
    raise exception 'This booking can no longer be cancelled online';
  end if;

  if v_hours < 48 then
    if not p_accept_cancellation_fee then
      raise exception 'You must accept the cancellation fee to cancel within 48 hours of pickup';
    end if;

    select coalesce(c.daily_price, 0)
    into v_fee
    from public.cars c
    where c.id = v_booking.car_id;

    if v_fee <= 0 then
      v_days := greatest(1, v_booking.return_date - v_booking.pickup_date);
      v_fee := round(coalesce(v_booking.subtotal, 0) / v_days, 2);
    end if;
  end if;

  update public.bookings b
  set
    status = 'cancelled',
    cancellation_fee = case when v_fee > 0 then v_fee else null end,
    cancellation_fee_accepted_at = case when v_fee > 0 then now() else null end
  where b.id = p_booking_id;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Booking not found or cannot be cancelled';
  end if;
end;
$$;

grant execute on function public.cancel_booking(uuid, boolean) to authenticated;

create or replace function public.update_booking_rental(
  p_booking_id uuid,
  p_pickup_date date default null,
  p_return_date date default null,
  p_delivery_address text default null,
  p_collection_address text default null,
  p_car_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_booking public.bookings%rowtype;
  v_pickup date;
  v_return date;
  v_car_id uuid;
  v_pickup_ts timestamptz;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(p.email, u.email)
  into v_email
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_user_id;

  select * into v_booking
  from public.bookings b
  where b.id = p_booking_id
    and b.status in ('pending', 'confirmed')
    and (
      b.user_id = v_user_id
      or (v_email is not null and lower(b.guest_email) = lower(v_email))
    );

  if not found then
    raise exception 'Booking not found';
  end if;

  v_pickup_ts := (v_booking.pickup_date + coalesce(v_booking.pickup_time, time '10:00'))::timestamp at time zone 'America/Curacao';

  if v_pickup_ts - now() < interval '48 hours' then
    raise exception 'Booking can no longer be changed online. Contact us at least 48 hours before pickup.';
  end if;

  v_pickup := coalesce(p_pickup_date, v_booking.pickup_date);
  v_return := coalesce(p_return_date, v_booking.return_date);
  v_car_id := coalesce(p_car_id, v_booking.car_id);

  if v_return < v_pickup then
    raise exception 'Return date must be on or after pickup date';
  end if;

  if public.car_has_booking_conflict(v_car_id, v_pickup, v_return, p_booking_id) then
    raise exception 'That car is not available for the selected dates';
  end if;

  update public.bookings
  set
    pickup_date = v_pickup,
    return_date = v_return,
    delivery_address = coalesce(nullif(trim(p_delivery_address), ''), delivery_address),
    collection_address = coalesce(nullif(trim(p_collection_address), ''), collection_address),
    car_id = v_car_id,
    user_id = coalesce(user_id, v_user_id)
  where id = p_booking_id;
end;
$$;
