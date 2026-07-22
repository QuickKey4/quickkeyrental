-- Launch RPC permission correction:
-- - no business logic changes
-- - no table/schema/data changes
-- - only explicit EXECUTE grants for the intended runtime paths

revoke execute on function public.confirm_booking_sentoo_payment(uuid, text) from public;
revoke execute on function public.confirm_booking_sentoo_payment(uuid, text) from anon;
revoke execute on function public.confirm_booking_sentoo_payment(uuid, text) from authenticated;
grant execute on function public.confirm_booking_sentoo_payment(uuid, text) to service_role;

revoke execute on function public.create_checkout_hold(
  text, uuid, date, date, time without time zone, time without time zone,
  text, text, text
) from public;
revoke execute on function public.create_checkout_hold(
  text, uuid, date, date, time without time zone, time without time zone,
  text, text, text
) from anon;
revoke execute on function public.create_checkout_hold(
  text, uuid, date, date, time without time zone, time without time zone,
  text, text, text
) from authenticated;
grant execute on function public.create_checkout_hold(
  text, uuid, date, date, time without time zone, time without time zone,
  text, text, text
) to service_role;

revoke execute on function public.finalize_checkout_hold(
  uuid, text, text, text, text, text, boolean, date, text, text, numeric, numeric,
  numeric, jsonb, text, text, text, text, numeric, numeric, numeric, numeric,
  text, text, date, uuid, numeric
) from public;
revoke execute on function public.finalize_checkout_hold(
  uuid, text, text, text, text, text, boolean, date, text, text, numeric, numeric,
  numeric, jsonb, text, text, text, text, numeric, numeric, numeric, numeric,
  text, text, date, uuid, numeric
) from anon;
revoke execute on function public.finalize_checkout_hold(
  uuid, text, text, text, text, text, boolean, date, text, text, numeric, numeric,
  numeric, jsonb, text, text, text, text, numeric, numeric, numeric, numeric,
  text, text, date, uuid, numeric
) from authenticated;
grant execute on function public.finalize_checkout_hold(
  uuid, text, text, text, text, text, boolean, date, text, text, numeric, numeric,
  numeric, jsonb, text, text, text, text, numeric, numeric, numeric, numeric,
  text, text, date, uuid, numeric
) to service_role;

revoke execute on function public.update_booking_service_items(
  uuid, text, text, jsonb, text, text
) from public;
revoke execute on function public.update_booking_service_items(
  uuid, text, text, jsonb, text, text
) from anon;
grant execute on function public.update_booking_service_items(
  uuid, text, text, jsonb, text, text
) to authenticated, service_role;

revoke execute on function public.delete_own_pending_document(uuid) from public;
revoke execute on function public.delete_own_pending_document(uuid) from anon;
grant execute on function public.delete_own_pending_document(uuid) to authenticated, service_role;
