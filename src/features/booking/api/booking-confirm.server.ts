import { getSupabaseAdminClient } from "@/lib/supabase/admin.server";

export async function confirmBookingPayment(bookingId: string, paymentIntentId?: string | null) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.rpc("confirm_booking_payment", {
    p_booking_id: bookingId,
    p_payment_intent_id: paymentIntentId ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function confirmBookingSentooPayment(
  bookingId: string,
  transactionId?: string | null,
) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.rpc("confirm_booking_sentoo_payment", {
    p_booking_id: bookingId,
    p_transaction_id: transactionId ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function confirmBookingPayAtArrival(bookingId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.rpc("confirm_booking_pay_at_arrival", {
    p_booking_id: bookingId,
  });

  if (error) throw new Error(error.message);
}
