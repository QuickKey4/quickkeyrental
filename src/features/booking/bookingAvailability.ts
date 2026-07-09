import type { CarAvailability } from "./bookingTypes";

/** Booking statuses that block a vehicle for overlapping dates. */
export const BLOCKING_BOOKING_STATUSES = ["pending", "confirmed"] as const;

/**
 * Inclusive rental period overlap (matches Supabase `rental_periods_overlap`).
 *
 * Example: existing Jun 12–15 vs requested Jun 16–20 → false (available).
 *          existing Jun 12–15 vs requested Jun 14–18 → true (blocked).
 */
export function rentalPeriodsOverlap(
  pickupA: string,
  returnA: string,
  pickupB: string,
  returnB: string,
): boolean {
  return pickupA <= returnB && returnA >= pickupB;
}

export function isCarAvailableInList(
  carId: string,
  availability: CarAvailability[],
): boolean {
  const row = availability.find((item) => item.car.id === carId);
  return row?.available === true;
}
