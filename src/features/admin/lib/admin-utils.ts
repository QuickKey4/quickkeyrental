import type { Tables } from "@/lib/supabase/database.types";

export type AdminBooking = Tables<"bookings"> & {
  cars: Pick<
    Tables<"cars">,
    "id" | "name" | "image_url" | "daily_price" | "license_plate" | "fleet_status"
  > | null;
};

export type OperationalBookingStatus =
  | "pending"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled";

export type FleetStatus = "available" | "reserved" | "on_rental" | "maintenance" | "disabled";

export type AdminBookingFilter =
  | "all"
  | "today"
  | "upcoming"
  | "active"
  | "completed"
  | "cancelled"
  | "pending"
  | "archived";

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

export function isArchivedBooking(booking: Pick<Tables<"bookings">, "archived_at">): boolean {
  return Boolean(booking.archived_at);
}

const HIDDEN_ADMIN_CUSTOMER_EMAILS = new Set(["e.c.merencia@live.nl", "test@gmail.com"]);

const HIDDEN_ADMIN_CUSTOMER_NAMES = new Set([
  "checkout hold",
  "edvienne merencia",
  "test merencia",
  "test test",
]);

export function isHiddenAdminCustomer(
  booking: Pick<Tables<"bookings">, "guest_email" | "guest_name">,
): boolean {
  const email = booking.guest_email.trim().toLowerCase();
  const name = booking.guest_name.trim().toLowerCase();

  return (
    email.endsWith("@quickkey.local") ||
    HIDDEN_ADMIN_CUSTOMER_EMAILS.has(email) ||
    HIDDEN_ADMIN_CUSTOMER_NAMES.has(name)
  );
}

export function filterAdminBookings(
  bookings: AdminBooking[],
  filter: AdminBookingFilter,
  today = todayKey(),
): AdminBooking[] {
  const includeArchived = filter === "all" || filter === "archived";
  let filtered = includeArchived ? [...bookings] : bookings.filter((b) => !isArchivedBooking(b));

  if (filter === "archived") {
    filtered = filtered.filter((b) => isArchivedBooking(b));
    filtered.sort((a, b) => (b.archived_at ?? "").localeCompare(a.archived_at ?? ""));
  } else if (filter === "today") {
    filtered = filtered.filter(
      (b) => b.status !== "cancelled" && (b.pickup_date === today || b.return_date === today),
    );
    filtered.sort((a, b) => todayBookingTime(a, today).localeCompare(todayBookingTime(b, today)));
  } else if (filter === "upcoming") {
    filtered = filtered.filter(
      (b) =>
        getOperationalStatus(b, today) === "confirmed" ||
        getOperationalStatus(b, today) === "pending",
    );
    filtered.sort((a, b) => a.pickup_date.localeCompare(b.pickup_date));
  } else if (filter === "active") {
    filtered = filtered.filter((b) => getOperationalStatus(b, today) === "active");
    filtered.sort((a, b) => a.return_date.localeCompare(b.return_date));
  } else if (filter === "completed") {
    filtered = filtered.filter((b) => getOperationalStatus(b, today) === "completed");
    filtered.sort((a, b) => b.return_date.localeCompare(a.return_date));
  } else if (filter === "cancelled") {
    filtered = filtered.filter((b) => b.status === "cancelled");
    filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } else if (filter === "pending") {
    filtered = filtered.filter((b) => b.status === "pending");
    filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } else {
    filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  return filtered;
}

function todayBookingTime(booking: AdminBooking, today: string): string {
  if (booking.pickup_date === today) return booking.pickup_time;
  if (booking.return_date === today) return booking.return_time;
  return "23:59";
}

export function bookingRef(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function pickupLabel(
  booking: Pick<Tables<"bookings">, "delivery_address" | "accommodation" | "pickup_location">,
): string {
  if (booking.delivery_address?.trim()) return booking.delivery_address.trim();
  if (booking.accommodation?.trim()) return booking.accommodation.trim();
  return booking.pickup_location;
}

export function returnLabel(
  booking: Pick<Tables<"bookings">, "collection_address" | "pickup_location">,
): string {
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

export function formatAdminDate(dateKey: string): string {
  if (!dateKey) return "—";
  const [year, month, day] = dateKey.split("-");
  if (!year || !month || !day) return dateKey;
  return `${day}-${month}-${year}`;
}

export function formatAdminDateTime(dateKey: string, time?: string | null): string {
  const formattedDate = formatAdminDate(dateKey);
  const formattedTime = time ? time.slice(0, 5) : "";
  return formattedTime ? `${formattedDate} ${formattedTime}` : formattedDate;
}

export function formatAdminShortDate(dateKey: string, intlLocale: string): string {
  if (!dateKey) return "—";
  return new Intl.DateTimeFormat(intlLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));
}
