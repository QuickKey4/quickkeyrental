import type { Messages } from "@/i18n/messages";
import type { VehicleKey } from "@/lib/fleet";

import type { BookingStep } from "./bookingTypes";

export function stepIndex(step: BookingStep): number {
  const order: BookingStep[] = [
    "dates",
    "cars",
    "customer",
    "extras",
    "review",
    "payment",
    "confirmation",
  ];
  return order.indexOf(step);
}

export function vehicleBaggageCopy(
  book: Messages["book"],
  fleetKey: VehicleKey | null,
): string | null {
  if (!fleetKey) return null;
  return book.vehicleBaggage[fleetKey];
}
