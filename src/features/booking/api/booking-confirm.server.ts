import { BRAND, formatPrice } from "@/lib/brand";
import { resolveEmailLocale, sendLoggedTemplateEmail } from "@/lib/email.server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin.server";

type BookingEmailRow = {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  pickup_date: string;
  pickup_time: string;
  return_date: string;
  return_time: string;
  delivery_address: string | null;
  collection_address: string | null;
  pickup_location: string | null;
  return_location: string | null;
  total: number;
  payment_status: string;
  status: string;
  locale?: string | null;
  user_id?: string | null;
  cars: { name: string | null } | null;
};

function bookingRef(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function locationLabel(primary?: string | null, fallback?: string | null): string {
  return primary?.trim() || fallback?.trim() || "See booking details";
}

async function loadBookingForEmail(bookingId: string): Promise<BookingEmailRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
        id,
        guest_name,
        guest_email,
        guest_phone,
        pickup_date,
        pickup_time,
        return_date,
        return_time,
        delivery_address,
        collection_address,
        pickup_location,
        return_location,
        total,
        payment_status,
        status,
        locale,
        user_id,
        cars ( name )
      `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as BookingEmailRow | null;
}

async function sendBookingConfirmationEmails(bookingId: string): Promise<void> {
  const booking = await loadBookingForEmail(bookingId);
  if (!booking?.guest_email) return;

  const ownerEmail = process.env.BOOKING_NOTIFICATION_EMAIL ?? BRAND.email;
  const input = {
    bookingRef: bookingRef(booking.id),
    guestName: booking.guest_name,
    customerName: booking.guest_name,
    customerEmail: booking.guest_email,
    customerPhone: booking.guest_phone,
    vehicle: booking.cars?.name ?? "Rental car",
    pickup: `${booking.pickup_date} ${booking.pickup_time}`,
    return: `${booking.return_date} ${booking.return_time}`,
    delivery: locationLabel(booking.delivery_address, booking.pickup_location),
    collection: locationLabel(booking.collection_address, booking.return_location),
    total: formatPrice(Number(booking.total)),
    paymentStatus: booking.payment_status,
    accountUrl: `${BRAND.website}/account/bookings/${booking.id}`,
    adminUrl: `${BRAND.website}/admin/bookings/${booking.id}`,
  };
  await Promise.all([
    sendLoggedTemplateEmail({
      templateKey: "booking_confirmation",
      locale: resolveEmailLocale(booking.locale),
      to: booking.guest_email,
      input,
      bookingId: booking.id,
      customerId: booking.user_id ?? null,
      idempotencyKey: `booking_confirmation:customer:${booking.id}`,
    }),
    sendLoggedTemplateEmail({
      templateKey: "admin_booking_confirmed",
      locale: "en",
      to: ownerEmail,
      input,
      bookingId: booking.id,
      customerId: booking.user_id ?? null,
      idempotencyKey: `booking_confirmation:admin:${booking.id}`,
    }),
  ]);
}

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
  const { data: before } = await supabase
    .from("bookings")
    .select("payment_status, status")
    .eq("id", bookingId)
    .maybeSingle();
  const alreadyConfirmed = before?.payment_status === "paid" || before?.status === "confirmed";

  const { error } = await supabase.rpc("confirm_booking_sentoo_payment", {
    p_booking_id: bookingId,
    p_transaction_id: transactionId ?? null,
  });

  if (error) throw new Error(error.message);

  if (!alreadyConfirmed) {
    try {
      await sendBookingConfirmationEmails(bookingId);
    } catch (emailError) {
      console.error("[quickkey.email.booking_confirmation_failed]", {
        bookingId,
        error: emailError instanceof Error ? emailError.message : "Unknown email error",
      });
    }
  }
}

export async function confirmBookingPayAtArrival(bookingId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.rpc("confirm_booking_pay_at_arrival", {
    p_booking_id: bookingId,
  });

  if (error) throw new Error(error.message);
}
