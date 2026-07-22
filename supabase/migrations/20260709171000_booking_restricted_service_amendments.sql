-- Restricted customer self-service amendments:
-- - no date, vehicle, owner, or primary renter edits
-- - only service/location/additional-driver/free-extra changes
-- - only more than 7 days before pickup in the operational timezone
-- - audit changes without mutating paid amendments before payment support exists

create table if not exists public.booking_change_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  user_id uuid references public.profiles(id),
  source text not null default 'customer_portal'
    check (source in ('customer_portal', 'admin', 'system')),
  change_type text not null,
  old_values jsonb not null default '{}'::jsonb,
  new_values jsonb not null default '{}'::jsonb,
  price_delta numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.booking_change_events enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'booking_change_events'
      and policyname = 'Users can read their booking change events'
  ) then
    create policy "Users can read their booking change events"
      on public.booking_change_events
      for select
      to authenticated
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.bookings b
          where b.id = booking_id
            and b.user_id = auth.uid()
        )
      );
  end if;
end;
$$;

create or replace function public.update_booking_service_items(
  p_booking_id uuid,
  p_delivery_address text default null,
  p_collection_address text default null,
  p_add_extras jsonb default '[]'::jsonb,
  p_additional_driver_name text default null,
  p_additional_driver_license text default null
)
returns table (
  old_total numeric,
  new_total numeric,
  price_delta numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_booking public.bookings%rowtype;
  v_pickup_ts timestamptz;
  v_days integer;
  v_extra jsonb;
  v_extra_row public.extras%rowtype;
  v_added_total numeric := 0;
  v_old_values jsonb := '{}'::jsonb;
  v_new_values jsonb := '{}'::jsonb;
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
    )
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  v_pickup_ts :=
    (v_booking.pickup_date + coalesce(v_booking.pickup_time, time '10:00'))::timestamp
    at time zone 'America/Curacao';

  if v_pickup_ts - now() <= interval '7 days' then
    raise exception 'Online changes are available until 7 days before pickup. Please contact us on WhatsApp.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_booking.id::text, 1));

  v_days := greatest(1, v_booking.return_date - v_booking.pickup_date);
  old_total := coalesce(v_booking.total, 0);

  if p_delivery_address is not null and nullif(trim(p_delivery_address), '') is not null then
    v_old_values := v_old_values || jsonb_build_object('delivery_address', v_booking.delivery_address);
    v_new_values := v_new_values || jsonb_build_object('delivery_address', trim(p_delivery_address));
  end if;

  if p_collection_address is not null and nullif(trim(p_collection_address), '') is not null then
    v_old_values := v_old_values || jsonb_build_object('collection_address', v_booking.collection_address);
    v_new_values := v_new_values || jsonb_build_object('collection_address', trim(p_collection_address));
  end if;

  if p_additional_driver_name is not null and nullif(trim(p_additional_driver_name), '') is not null then
    v_old_values := v_old_values || jsonb_build_object(
      'additional_driver_name', v_booking.additional_driver_name,
      'additional_driver_license', v_booking.additional_driver_license
    );
    v_new_values := v_new_values || jsonb_build_object(
      'additional_driver_name', trim(p_additional_driver_name),
      'additional_driver_license', nullif(trim(coalesce(p_additional_driver_license, '')), '')
    );
  end if;

  for v_extra in
    select * from jsonb_array_elements(coalesce(p_add_extras, '[]'::jsonb))
  loop
    select * into v_extra_row
    from public.extras
    where id = (v_extra ->> 'id')::uuid
      and is_active = true;

    if not found then
      raise exception 'Extra is not available';
    end if;

    if coalesce((v_extra ->> 'quantity')::integer, 0) <= 0 then
      continue;
    end if;

    if coalesce(v_extra_row.price_per_day, 0) > 0 then
      raise exception 'Paid booking changes require staff confirmation';
    end if;

    insert into public.booking_extras (
      booking_id,
      extra_name,
      price_per_day,
      quantity,
      total
    )
    values (
      v_booking.id,
      v_extra_row.name,
      v_extra_row.price_per_day,
      (v_extra ->> 'quantity')::integer,
      v_extra_row.price_per_day * (v_extra ->> 'quantity')::integer * v_days
    );

    v_added_total :=
      v_added_total + (v_extra_row.price_per_day * (v_extra ->> 'quantity')::integer * v_days);
  end loop;

  if v_added_total > 0 then
    v_new_values := v_new_values || jsonb_build_object('added_extras_total', v_added_total);
  end if;

  new_total := old_total + v_added_total;
  price_delta := new_total - old_total;

  update public.bookings
  set
    delivery_address = coalesce(nullif(trim(p_delivery_address), ''), delivery_address),
    collection_address = coalesce(nullif(trim(p_collection_address), ''), collection_address),
    additional_driver_name = coalesce(nullif(trim(p_additional_driver_name), ''), additional_driver_name),
    additional_driver_license = coalesce(nullif(trim(p_additional_driver_license), ''), additional_driver_license),
    extras_total = coalesce(extras_total, 0) + v_added_total,
    total = new_total,
    user_id = coalesce(user_id, v_user_id)
  where id = v_booking.id;

  insert into public.booking_change_events (
    booking_id,
    user_id,
    source,
    change_type,
    old_values,
    new_values,
    price_delta
  )
  values (
    v_booking.id,
    v_user_id,
    'customer_portal',
    'restricted_service_update',
    v_old_values,
    v_new_values,
    price_delta
  );

  return next;
end;
$$;

revoke execute on function public.update_booking_service_items(uuid, text, text, jsonb, text, text)
  from public;

grant execute on function public.update_booking_service_items(uuid, text, text, jsonb, text, text)
  to authenticated;
