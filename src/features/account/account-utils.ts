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

export function sortBookingsByNextAction(bookings: BookingWithCar[]): BookingWithCar[] {
  const today = todayKey();
  return [...bookings].sort((a, b) => {
    const aUpcoming = isUpcomingBooking(a, today);
    const bUpcoming = isUpcomingBooking(b, today);

    if (aUpcoming && bUpcoming) {
      return compareDateTime(a.pickup_date, a.pickup_time, b.pickup_date, b.pickup_time);
    }
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;

    return compareDateTime(b.pickup_date, b.pickup_time, a.pickup_date, a.pickup_time);
  });
}

export function sortUpcomingBookings(bookings: BookingWithCar[]): BookingWithCar[] {
  return [...bookings].sort((a, b) =>
    compareDateTime(a.pickup_date, a.pickup_time, b.pickup_date, b.pickup_time),
  );
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

export function formatAccountDate(date: string, intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function maskLicenseNumber(value?: string | null): string {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 4) return "••••";
  return `${"•".repeat(Math.min(6, trimmed.length - 3))}${trimmed.slice(-3)}`;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function compareDateTime(
  aDate: string,
  aTime: string | null | undefined,
  bDate: string,
  bTime: string | null | undefined,
): number {
  const a = new Date(`${aDate}T${(aTime ?? "12:00:00").slice(0, 8)}`).getTime();
  const b = new Date(`${bDate}T${(bTime ?? "12:00:00").slice(0, 8)}`).getTime();
  return a - b;
}
