import type { BookingWithCar } from "@/features/account/account-queries";

export const FREE_CANCELLATION_HOURS = 48;
export const MODIFY_WINDOW_HOURS = 24 * 7;
export const RENTAL_TIME_ZONE = "America/Curacao";

type BookingLike = Pick<BookingWithCar, "status" | "pickup_date" | "pickup_time" | "return_date"> & {
  cars?: Pick<NonNullable<BookingWithCar["cars"]>, "daily_price"> | null;
  subtotal?: number;
};

export function pickupDateTime(
  booking: Pick<BookingWithCar, "pickup_date" | "pickup_time">,
): Date {
  const time = booking.pickup_time?.slice(0, 5) ?? "10:00";
  return new Date(`${booking.pickup_date}T${time}:00-04:00`);
}

export function hoursUntilPickup(booking: BookingLike, now = new Date()): number {
  return (pickupDateTime(booking).getTime() - now.getTime()) / (1000 * 60 * 60);
}

export function rentalDays(pickupDate: string, returnDate: string): number {
  const pickup = new Date(`${pickupDate}T12:00:00`);
  const returnDay = new Date(`${returnDate}T12:00:00`);
  const diff = Math.round((returnDay.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

export function getCancellationFeeAmount(booking: BookingLike): number {
  const daily = Number(booking.cars?.daily_price ?? 0);
  if (daily > 0) return daily;

  const subtotal = Number(booking.subtotal ?? 0);
  if (subtotal > 0) {
    return Math.round(subtotal / rentalDays(booking.pickup_date, booking.return_date));
  }

  return 0;
}

export function isFreeCancellation(booking: BookingLike, now = new Date()): boolean {
  return hoursUntilPickup(booking, now) >= FREE_CANCELLATION_HOURS;
}

export function requiresCancellationFee(booking: BookingLike, now = new Date()): boolean {
  const hours = hoursUntilPickup(booking, now);
  return hours > 0 && hours < FREE_CANCELLATION_HOURS;
}

export function canCancelBooking(booking: BookingLike, now = new Date()): boolean {
  if (booking.status !== "pending" && booking.status !== "confirmed") return false;
  return hoursUntilPickup(booking, now) > 0;
}

export function canModifyBooking(booking: BookingLike, now = new Date()): boolean {
  if (booking.status !== "pending" && booking.status !== "confirmed") return false;
  if (booking.return_date < todayKey()) return false;
  return hoursUntilPickup(booking, now) >= MODIFY_WINDOW_HOURS;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
