-- Sentoo local bank payments (Curaçao / Dutch Caribbean)

alter table public.bookings
  add column if not exists payment_provider text not null default 'none',
  add column if not exists sentoo_transaction_id text,
  add column if not exists sentoo_status text;

create index if not exists idx_bookings_sentoo_transaction_id
  on public.bookings (sentoo_transaction_id)
  where sentoo_transaction_id is not null;

create or replace function public.set_booking_sentoo_transaction(
  p_booking_id uuid,
  p_transaction_id text,
  p_status text default 'issued'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings
  set
    payment_provider = 'sentoo',
    sentoo_transaction_id = p_transaction_id,
    sentoo_status = p_status
  where id = p_booking_id;
end;
$$;

grant execute on function public.set_booking_sentoo_transaction(uuid, text, text) to service_role;

create or replace function public.update_booking_sentoo_status(
  p_booking_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings
  set sentoo_status = p_status
  where id = p_booking_id;
end;
$$;

grant execute on function public.update_booking_sentoo_status(uuid, text) to service_role;

create or replace function public.get_booking_id_by_sentoo_transaction(p_transaction_id text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id
  from public.bookings
  where sentoo_transaction_id = p_transaction_id
  limit 1;
$$;

grant execute on function public.get_booking_id_by_sentoo_transaction(text) to service_role;

create or replace function public.confirm_booking_sentoo_payment(
  p_booking_id uuid,
  p_transaction_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings
  set
    status = 'confirmed',
    payment_status = 'paid',
    payment_provider = 'sentoo',
    sentoo_status = 'success',
    sentoo_transaction_id = coalesce(p_transaction_id, sentoo_transaction_id)
  where
    id = p_booking_id
    and status = 'pending'
    and payment_status is distinct from 'paid';
end;
$$;

grant execute on function public.confirm_booking_sentoo_payment(uuid, text) to service_role;
