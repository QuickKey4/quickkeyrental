-- Account login lookup, booking cancel, and booking update for customer self-service.

create or replace function public.lookup_email_for_login(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_user_exists boolean;
  v_booking_count integer;
begin
  if v_email = '' then
    return jsonb_build_object('status', 'not_found', 'booking_count', 0);
  end if;

  select exists(
    select 1 from auth.users u where lower(u.email) = v_email
  ) into v_user_exists;

  select count(*)::integer into v_booking_count
  from public.bookings b
  where lower(b.guest_email) = v_email
    and b.status in ('pending', 'confirmed');

  if v_user_exists then
    return jsonb_build_object('status', 'existing_account', 'booking_count', v_booking_count);
  elsif v_booking_count > 0 then
    return jsonb_build_object('status', 'bookings_only', 'booking_count', v_booking_count);
  else
    return jsonb_build_object('status', 'not_found', 'booking_count', 0);
  end if;
end;
$$;

grant execute on function public.lookup_email_for_login(text) to anon, authenticated;

create or replace function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_updated integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(p.email, u.email)
  into v_email
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_user_id;

  update public.bookings b
  set status = 'cancelled'
  where b.id = p_booking_id
    and b.status in ('pending', 'confirmed')
    and (
      b.user_id = v_user_id
      or (v_email is not null and lower(b.guest_email) = lower(v_email))
    );

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Booking not found or cannot be cancelled';
  end if;
end;
$$;

grant execute on function public.cancel_booking(uuid) to authenticated;

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

grant execute on function public.update_booking_rental(uuid, date, date, text, text, uuid) to authenticated;
