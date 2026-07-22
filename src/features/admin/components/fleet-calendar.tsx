import { Link } from "@tanstack/react-router";

import type { Tables } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

import { useAdminI18n, fleetStatusLabel } from "../hooks/use-admin-i18n";
import { bookingRef, dateRangeKeys, formatAdminDate, type FleetStatus } from "../lib/admin-utils";
import { AdminBadge } from "./admin-ui";

type CalendarBooking = Pick<
  Tables<"bookings">,
  "id" | "car_id" | "guest_name" | "pickup_date" | "return_date" | "pickup_time" | "return_time"
>;

type FleetCalendarProps = {
  startDate: string;
  days: number;
  cars: Tables<"cars">[];
  bookings: CalendarBooking[];
};

const DAY_WIDTH = 88;

export function FleetCalendar({ startDate, days, cars, bookings }: FleetCalendarProps) {
  const { t, intlLocale } = useAdminI18n();
  const dates = dateRangeKeys(startDate, days);

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white">
      <div style={{ minWidth: 220 + days * DAY_WIDTH }}>
        <div className="flex border-b border-black/[0.06] bg-[#fafafa]">
          <div className="sticky left-0 z-10 w-[220px] shrink-0 border-r border-black/[0.06] bg-[#fafafa] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.calendar.vehicleColumn}
          </div>
          {dates.map((date) => (
            <div
              key={date}
              className="shrink-0 border-r border-black/[0.04] px-2 py-3 text-center text-[11px] font-medium text-muted-foreground"
              style={{ width: DAY_WIDTH }}
            >
              <div>{formatDay(date, intlLocale)}</div>
              <div className="text-[10px]">{formatAdminDate(date).slice(0, 5)}</div>
            </div>
          ))}
        </div>

        {cars.map((car) => {
          const carBookings = bookings.filter((b) => b.car_id === car.id);
          return (
            <div key={car.id} className="flex border-b border-black/[0.04] last:border-0">
              <div className="sticky left-0 z-10 w-[220px] shrink-0 border-r border-black/[0.06] bg-white px-4 py-4">
                <p className="font-semibold text-sm text-[var(--logo-black)]">{car.name}</p>
                <p className="text-xs text-muted-foreground">{car.license_plate ?? "—"}</p>
                <AdminBadge tone={car.fleet_status === "available" ? "green" : "amber"}>
                  {fleetStatusLabel(car.fleet_status as FleetStatus, t.fleetStatus)}
                </AdminBadge>
              </div>
              <div className="relative flex" style={{ width: days * DAY_WIDTH }}>
                {dates.map((date) => (
                  <div
                    key={date}
                    className="shrink-0 border-r border-black/[0.03]"
                    style={{ width: DAY_WIDTH, height: 72 }}
                  />
                ))}
                {carBookings.map((booking) => {
                  const startIdx = dates.indexOf(booking.pickup_date);
                  const endIdx = dates.indexOf(booking.return_date);
                  if (startIdx === -1 && endIdx === -1) return null;
                  const left = Math.max(0, startIdx) * DAY_WIDTH + 4;
                  const span = (endIdx === -1 ? days - 1 : endIdx) - Math.max(0, startIdx) + 1;
                  const width = span * DAY_WIDTH - 8;
                  return (
                    <Link
                      key={booking.id}
                      to="/admin/bookings/$bookingId"
                      params={{ bookingId: booking.id }}
                      className={cn(
                        "absolute top-3 flex h-12 flex-col justify-center rounded-lg px-2 text-white shadow-sm transition-opacity hover:opacity-90",
                        "bg-[var(--logo-red)]",
                      )}
                      style={{ left, width: Math.max(width, 60) }}
                      title={`${booking.guest_name} · ${formatAdminDate(booking.pickup_date)} – ${formatAdminDate(booking.return_date)}`}
                    >
                      <span className="truncate text-[11px] font-semibold">
                        {booking.guest_name}
                      </span>
                      <span className="truncate text-[9px] opacity-90">
                        {bookingRef(booking.id)} · {booking.pickup_time.slice(0, 5)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDay(dateKey: string, intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, { weekday: "short" }).format(
    new Date(`${dateKey}T12:00:00`),
  );
}
