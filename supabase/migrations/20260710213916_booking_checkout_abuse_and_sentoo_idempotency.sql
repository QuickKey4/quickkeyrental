-- Protect the three-car fleet from checkout-hold exhaustion and serialize
-- Sentoo payment creation. This migration does not alter existing bookings.

create schema if not exists private;

create table if not exists private.checkout_hold_claims (
  id uuid primary key default gen_random_uuid(),
  fingerprint_hash text not null,
  checkout_session_id text not null,
  booking_id uuid references public.bookings(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  expires_at timestamptz not null,
  released_at timestamptz,
  constraint checkout_hold_claims_fingerprint_format
    check (fingerprint_hash ~ '^[0-9a-f]{64}$')
);

create index if not exists checkout_hold_claims_fingerprint_active_idx
  on private.checkout_hold_claims (fingerprint_hash, expires_at desc)
  where released_at is null;

create index if not exists checkout_hold_claims_session_active_idx
  on private.checkout_hold_claims (checkout_session_id, expires_at desc)
  where released_at is null;

revoke all on table private.checkout_hold_claims from public, anon, authenticated;
grant select, insert, update, delete on table private.checkout_hold_claims to service_role;

create or replace function public.claim_checkout_hold_slot(
  p_fingerprint_hash text,
  p_checkout_session_id text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_existing_id uuid;
  v_claim_id uuid;
  v_active_count integer;
  v_recent_count integer;
begin
  if p_fingerprint_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid checkout fingerprint';
  end if;

  if nullif(trim(p_checkout_session_id), '') is null then
    raise exception 'Checkout session is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('hold-rate:' || p_fingerprint_hash, 0));

  delete from private.checkout_hold_claims
  where expires_at < now() - interval '24 hours';

  select id into v_existing_id
  from private.checkout_hold_claims
  where checkout_session_id = p_checkout_session_id
    and fingerprint_hash = p_fingerprint_hash
    and released_at is null
    and expires_at > now()
  order by claimed_at desc
  limit 1;

  if found then
    return v_existing_id;
  end if;

  select count(*) into v_active_count
  from private.checkout_hold_claims
  where fingerprint_hash = p_fingerprint_hash
    and released_at is null
    and expires_at > now();

  if v_active_count >= 2 then
    raise exception 'Too many active checkout holds. Complete or release an existing hold first.';
  end if;

  select count(*) into v_recent_count
  from private.checkout_hold_claims
  where fingerprint_hash = p_fingerprint_hash
    and claimed_at > now() - interval '15 minutes';

  if v_recent_count >= 6 then
    raise exception 'Too many checkout hold attempts. Please wait and try again.';
  end if;

  insert into private.checkout_hold_claims (
    fingerprint_hash,
    checkout_session_id,
    expires_at
  ) values (
    p_fingerprint_hash,
    p_checkout_session_id,
    now() + public.checkout_hold_interval()
  )
  returning id into v_claim_id;

  return v_claim_id;
end;
$$;

create or replace function public.complete_checkout_hold_slot(
  p_claim_id uuid,
  p_fingerprint_hash text,
  p_checkout_session_id text,
  p_booking_id uuid,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
begin
  update private.checkout_hold_claims
  set booking_id = p_booking_id,
      expires_at = p_expires_at
  where id = p_claim_id
    and fingerprint_hash = p_fingerprint_hash
    and checkout_session_id = p_checkout_session_id
    and released_at is null;

  if not found then
    raise exception 'Checkout hold claim not found';
  end if;
end;
$$;

create or replace function public.release_checkout_hold_slot(
  p_claim_id uuid,
  p_fingerprint_hash text,
  p_checkout_session_id text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
begin
  update private.checkout_hold_claims
  set released_at = coalesce(released_at, now())
  where id = p_claim_id
    and fingerprint_hash = p_fingerprint_hash
    and checkout_session_id = p_checkout_session_id;
end;
$$;

revoke execute on function public.claim_checkout_hold_slot(text, text)
  from public, anon, authenticated;
revoke execute on function public.complete_checkout_hold_slot(uuid, text, text, uuid, timestamptz)
  from public, anon, authenticated;
revoke execute on function public.release_checkout_hold_slot(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.claim_checkout_hold_slot(text, text) to service_role;
grant execute on function public.complete_checkout_hold_slot(uuid, text, text, uuid, timestamptz)
  to service_role;
grant execute on function public.release_checkout_hold_slot(uuid, text, text) to service_role;

create or replace function private.release_finished_checkout_hold_claim()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
begin
  if new.payment_status = 'paid'
    or new.status <> 'pending'
    or new.expired_at is not null then
    update private.checkout_hold_claims
    set released_at = coalesce(released_at, now())
    where booking_id = new.id
      and released_at is null;
  end if;
  return new;
end;
$$;

revoke execute on function private.release_finished_checkout_hold_claim()
  from public, anon, authenticated;

drop trigger if exists release_finished_checkout_hold_claim on public.bookings;
create trigger release_finished_checkout_hold_claim
after update of payment_status, status, expired_at on public.bookings
for each row
execute function private.release_finished_checkout_hold_claim();

alter table public.bookings
  add column if not exists sentoo_checkout_request_id uuid,
  add column if not exists sentoo_checkout_started_at timestamptz;

create index if not exists bookings_sentoo_checkout_inflight_idx
  on public.bookings (sentoo_checkout_started_at)
  where sentoo_checkout_started_at is not null;

create or replace function public.claim_booking_sentoo_checkout(
  p_booking_id uuid,
  p_checkout_session_id text,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  select * into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.checkout_session_id is null
    or v_booking.checkout_session_id <> p_checkout_session_id then
    raise exception 'Checkout session does not match this booking.';
  end if;

  if v_booking.payment_status = 'paid' then
    return jsonb_build_object('claimed', false, 'paid', true);
  end if;

  if v_booking.status <> 'pending'
    or v_booking.expired_at is not null
    or v_booking.pending_expires_at is null
    or v_booking.pending_expires_at <= now() then
    raise exception 'Your reserved car hold has expired.';
  end if;

  if v_booking.sentoo_checkout_started_at is not null
    and v_booking.sentoo_checkout_started_at > now() - interval '2 minutes' then
    return jsonb_build_object('claimed', false, 'inFlight', true);
  end if;

  update public.bookings
  set sentoo_checkout_request_id = p_request_id,
      sentoo_checkout_started_at = now()
  where id = p_booking_id;

  return jsonb_build_object('claimed', true, 'requestId', p_request_id);
end;
$$;

create or replace function public.complete_booking_sentoo_checkout(
  p_booking_id uuid,
  p_checkout_session_id text,
  p_request_id uuid,
  p_transaction_id text,
  p_status text default 'issued'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.bookings
  set payment_provider = 'sentoo',
      sentoo_transaction_id = p_transaction_id,
      sentoo_status = p_status,
      sentoo_checkout_request_id = null,
      sentoo_checkout_started_at = null
  where id = p_booking_id
    and checkout_session_id = p_checkout_session_id
    and sentoo_checkout_request_id = p_request_id
    and payment_status is distinct from 'paid';

  if not found then
    raise exception 'Sentoo checkout claim does not match booking.';
  end if;
end;
$$;

create or replace function public.release_booking_sentoo_checkout(
  p_booking_id uuid,
  p_checkout_session_id text,
  p_request_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.bookings
  set sentoo_checkout_request_id = null,
      sentoo_checkout_started_at = null
  where id = p_booking_id
    and checkout_session_id = p_checkout_session_id
    and sentoo_checkout_request_id = p_request_id
    and sentoo_transaction_id is null;
end;
$$;

revoke execute on function public.claim_booking_sentoo_checkout(uuid, text, uuid)
  from public, anon, authenticated;
revoke execute on function public.complete_booking_sentoo_checkout(uuid, text, uuid, text, text)
  from public, anon, authenticated;
revoke execute on function public.release_booking_sentoo_checkout(uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function public.claim_booking_sentoo_checkout(uuid, text, uuid) to service_role;
grant execute on function public.complete_booking_sentoo_checkout(uuid, text, uuid, text, text)
  to service_role;
grant execute on function public.release_booking_sentoo_checkout(uuid, text, uuid) to service_role;
