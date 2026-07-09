-- Fix guest booking linkage after magic-link sign-in.
-- The client calls link_bookings_to_user() with no args; use auth.uid() server-side.

drop function if exists public.link_bookings_to_user(uuid);

create or replace function public.link_bookings_to_user()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_count integer;
begin
  if v_user_id is null then
    return 0;
  end if;

  select coalesce(p.email, u.email)
  into v_email
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_user_id;

  if v_email is null or v_email = '' then
    return 0;
  end if;

  update public.bookings b
  set user_id = v_user_id
  where b.user_id is null
    and lower(b.guest_email) = lower(v_email);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.link_bookings_to_user() to authenticated;
