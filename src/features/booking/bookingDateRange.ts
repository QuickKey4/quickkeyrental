import type { DateRange } from "react-day-picker";

import {
  normalizePickupDate,
  normalizeReturnDate,
  parseDateKey,
  startOfToday,
  toDateKey,
} from "@/lib/booking";

import type { BookingDraft } from "./bookingTypes";

export function createDateRangePatch({
  range,
  currentReturnDate,
  today = startOfToday(),
}: {
  range: DateRange | undefined;
  currentReturnDate: string;
  today?: Date;
}): Partial<BookingDraft> | null {
  if (!range?.from) return null;

  const previousReturnDate = parseDateKey(currentReturnDate);
  const normalizedPickup = normalizePickupDate(range.from, today);
  const normalizedReturn = normalizeReturnDate(range.to ?? previousReturnDate, normalizedPickup);

  return {
    pickupDate: toDateKey(normalizedPickup),
    returnDate: toDateKey(normalizedReturn),
    carId: null,
    fleetKey: null,
    lockedDailyPrice: null,
  };
}
