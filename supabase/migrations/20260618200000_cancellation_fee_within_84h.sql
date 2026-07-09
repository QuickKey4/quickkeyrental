-- Cancellation fee support: free before 84h, fee required within 84h of pickup.

alter table public.bookings
  add column if not exists cancellation_fee numeric,
  add column if not exists cancellation_fee_accepted_at timestamptz;

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

  if v_hours < 84 then
    if not p_accept_cancellation_fee then
      raise exception 'You must accept the cancellation fee to cancel within 84 hours of pickup';
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
