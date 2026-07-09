-- Confirm a booking when the guest chooses to pay cash/card on arrival.
-- Keeps payment_status as unpaid so staff can collect payment at handover.

create or replace function public.confirm_booking_pay_at_arrival(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings
  set
    status = 'confirmed',
    payment_status = 'unpaid'
  where
    id = p_booking_id
    and status = 'pending';
end;
$$;

grant execute on function public.confirm_booking_pay_at_arrival(uuid) to service_role;
