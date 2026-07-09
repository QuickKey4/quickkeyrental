import type { Tables } from "@/lib/supabase/database.types";

export type AdminBooking = Tables<"bookings"> & {
  cars: Pick<Tables<"cars">, "id" | "name" | "image_url" | "daily_price" | "license_plate" | "fleet_status"> | null;
};

export type OperationalBookingStatus =
  | "pending"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled";

export type FleetStatus =
  | "available"
  | "reserved"
  | "on_rental"
  | "maintenance"
  | "disabled";

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getOperationalStatus(
  booking: Pick<Tables<"bookings">, "status" | "pickup_date" | "return_date">,
  today = todayKey(),
): OperationalBookingStatus {
  if (booking.status === "cancelled") return "cancelled";
  if (booking.status === "pending") return "pending";
  if (booking.return_date < today) return "completed";
  if (booking.pickup_date <= today && booking.return_date >= today) return "active";
  return "confirmed";
}

export function bookingRef(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function pickupLabel(booking: Pick<Tables<"bookings">, "delivery_address" | "accommodation" | "pickup_location">): string {
  if (booking.delivery_address?.trim()) return booking.delivery_address.trim();
  if (booking.accommodation?.trim()) return booking.accommodation.trim();
  return booking.pickup_location;
}

export function returnLabel(booking: Pick<Tables<"bookings">, "collection_address" | "pickup_location">): string {
  return booking.collection_address?.trim() || booking.pickup_location;
}

export function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function dateRangeKeys(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}

export function daysBetweenInclusive(start: string, end: string): number {
  const a = new Date(`${start}T12:00:00`).getTime();
  const b = new Date(`${end}T12:00:00`).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

export const OPERATIONAL_STATUS_LABELS: Record<OperationalBookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  active: "Active Rental",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const FLEET_STATUS_LABELS: Record<FleetStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  on_rental: "On Rental",
  maintenance: "Maintenance",
  disabled: "Disabled",
};
