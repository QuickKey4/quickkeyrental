drop function if exists public.get_car_availability(date, date);

-- Richer fleet availability: overlap-based blocking + next-available hint per car.

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
    c.daily_price,
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

comment on function public.get_car_availability(date, date) is
  'Active fleet cars with overlap-based availability and next-available pickup hint when blocked.';

grant execute on function public.get_car_availability(date, date) to anon, authenticated;
