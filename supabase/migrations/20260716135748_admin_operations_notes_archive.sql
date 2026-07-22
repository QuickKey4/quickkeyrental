begin;

alter table public.bookings
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by text,
  add column if not exists archive_reason text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_archive_reason_length_check'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_archive_reason_length_check
      check (archive_reason is null or char_length(archive_reason) <= 1000);
  end if;
end;
$$;

create index if not exists idx_bookings_archived_at
  on public.bookings (archived_at);

create index if not exists idx_bookings_operational_unarchived
  on public.bookings (pickup_date, status)
  where archived_at is null;

create table if not exists public.booking_internal_notes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  author_identifier text not null default 'admin',
  author_display_label text not null default 'Admin',
  body text not null check (
    length(trim(body)) > 0
    and char_length(body) <= 5000
  ),
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.booking_internal_notes enable row level security;

revoke all on public.booking_internal_notes from anon;
revoke all on public.booking_internal_notes from authenticated;

create index if not exists idx_booking_internal_notes_booking_created
  on public.booking_internal_notes (booking_id, created_at desc);

create index if not exists idx_booking_internal_notes_booking_pinned
  on public.booking_internal_notes (booking_id, is_pinned desc, created_at desc);

commit;
