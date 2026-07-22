import { BRAND, formatPrice } from "@/lib/brand";
import { resolveEmailLocale, sendLoggedTemplateEmail } from "@/lib/email.server";

export type CancellationBooking = {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  pickup_date: string;
  return_date: string;
  pickup_time: string;
  return_time: string;
  delivery_address: string | null;
  collection_address?: string | null;
  total: number;
  cancellation_fee?: number | null;
  locale?: string | null;
  user_id?: string | null;
  cars?: { name?: string | null } | null;
};

function emailInput(booking: CancellationBooking) {
  const carName = booking.cars?.name ?? "Rental car";
  const ref = booking.id.slice(0, 8).toUpperCase();
  const fee = Number(booking.cancellation_fee ?? 0);

  return {
    bookingRef: ref,
    guestName: booking.guest_name,
    customerName: booking.guest_name,
    customerEmail: booking.guest_email,
    customerPhone: booking.guest_phone,
    vehicle: carName,
    pickup: `${booking.pickup_date} ${booking.pickup_time}`,
    return: `${booking.return_date} ${booking.return_time}`,
    delivery: booking.delivery_address ?? "See booking details",
    collection: booking.collection_address ?? booking.delivery_address ?? "See booking details",
    total: formatPrice(Number(booking.total)),
    paymentStatus: "Cancelled",
    cancellationFee: fee > 0 ? formatPrice(fee) : null,
    cancellationFeeStatus: fee > 0 ? "Accepted by customer; manual handling required" : null,
    adminUrl: `${BRAND.website}/admin/bookings/${booking.id}`,
    accountUrl: `${BRAND.website}/account/bookings/${booking.id}`,
  };
}

export async function sendBookingCancellationEmails(booking: CancellationBooking): Promise<void> {
  const ref = booking.id.slice(0, 8).toUpperCase();
  const ownerEmail = process.env.BOOKING_NOTIFICATION_EMAIL ?? BRAND.email;
  const input = emailInput(booking);

  await Promise.all([
    sendLoggedTemplateEmail({
      templateKey: "cancellation",
      locale: resolveEmailLocale(booking.locale),
      to: booking.guest_email,
      input,
      bookingId: booking.id,
      customerId: booking.user_id ?? null,
      idempotencyKey: `booking_cancellation:customer:${booking.id}`,
    }),
    sendLoggedTemplateEmail({
      templateKey: "admin_booking_cancelled",
      locale: "en",
      to: ownerEmail,
      input,
      bookingId: booking.id,
      customerId: booking.user_id ?? null,
      idempotencyKey: `booking_cancellation:admin:${booking.id}`,
    }),
  ]);
}
