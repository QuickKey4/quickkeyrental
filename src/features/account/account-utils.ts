import type { BookingWithCar } from "./account-queries";

export {
  canCancelBooking,
  canModifyBooking,
  getCancellationFeeAmount,
  hoursUntilPickup,
  isFreeCancellation,
  requiresCancellationFee,
} from "@/lib/booking-policy";

export function isUpcomingBooking(booking: BookingWithCar, today = todayKey()): boolean {
  return booking.status !== "cancelled" && booking.return_date >= today;
}

export function isPastBooking(booking: BookingWithCar, today = todayKey()): boolean {
  return booking.status !== "cancelled" && booking.return_date < today;
}

export function isCancelledBooking(booking: BookingWithCar): boolean {
  return booking.status === "cancelled";
}

export function bookingReference(booking: BookingWithCar): string {
  return booking.id.slice(0, 8).toUpperCase();
}

export function pickupLocationLabel(booking: BookingWithCar): string {
  if (booking.delivery_address?.trim()) return booking.delivery_address.trim();
  if (booking.accommodation?.trim()) return booking.accommodation.trim();
  return booking.pickup_location;
}

export function formatPastRentalMonth(pickupDate: string, intlLocale: string): string {
  const date = new Date(`${pickupDate}T12:00:00`);
  return new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(date);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
