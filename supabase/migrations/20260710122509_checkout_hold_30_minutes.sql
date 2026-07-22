insert into public.admin_settings (key, value)
values ('checkout_hold_minutes', '{"minutes": 30}'::jsonb)
on conflict (key) do update
set value = excluded.value;
