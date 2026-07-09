import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, MapPin } from "lucide-react";

import { FleetPhoto } from "@/components/fleet-photo";
import { useFleet } from "@/hooks/use-fleet";
import { useI18n } from "@/i18n/provider";
import { formatDateRange } from "@/i18n/format";
import type { BookingWithCar } from "@/features/account/account-queries";
import { formatPrice } from "@/lib/brand";
import { getVehicle } from "@/lib/fleet";
import type { VehicleKey } from "@/lib/fleet";
import { cn } from "@/lib/utils";

import {
  bookingReference,
  canCancelBooking,
  canModifyBooking,
  formatPastRentalMonth,
  pickupLocationLabel,
} from "../account-utils";
import { AccountCard } from "./account-ui";
import { BookingStatusBadge } from "./booking-status-badge";

type HistoryBookingCardProps = {
  booking: BookingWithCar;
  className?: string;
};

export function HistoryBookingCard({ booking, className }: HistoryBookingCardProps) {
  const { messages, intlLocale } = useI18n();
  const { fleet } = useFleet();
  const copy = messages.account.dashboard;

  const fleetKey = booking.cars?.image_url as VehicleKey | undefined;
  const vehicle = fleetKey ? getVehicle(fleet, fleetKey) : null;
  const dateRange = formatDateRange(intlLocale, booking.pickup_date, booking.return_date);
  const statusKey = booking.status as keyof typeof messages.account.bookings.status;
  const statusLabel = messages.account.bookings.status[statusKey] ?? booking.status;

  return (
    <AccountCard className={cn("transition-all hover:shadow-[0_12px_36px_rgba(16,16,16,0.08)]", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {vehicle ? (
          <FleetPhoto
            src={vehicle.image}
            alt={vehicle.name}
            className="size-24 shrink-0 rounded-2xl bg-[#f4f4f2] sm:size-28"
            imgClassName="p-2"
            fit="contain"
            tint={false}
          />
        ) : (
          <div className="size-24 shrink-0 rounded-2xl bg-[#f4f4f2] sm:size-28" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-mono text-xs font-medium text-[var(--logo-red)]">
                {bookingReference(booking)}
              </p>
              <h3 className="mt-1 font-display text-lg font-bold text-[var(--logo-black)]">
                {booking.cars?.name ?? messages.account.bookings.unknownVehicle}
              </h3>
            </div>
            <BookingStatusBadge label={statusLabel} variant={booking.status} />
          </div>

          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4 text-[var(--logo-red)]" />
            {formatPastRentalMonth(booking.pickup_date, intlLocale)} · {dateRange}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-bold text-[var(--logo-red)]">
              {formatPrice(Number(booking.total), intlLocale)}
            </p>
            <Link
              to="/account/bookings/$bookingId"
              params={{ bookingId: booking.id }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--logo-black)] transition-colors hover:text-[var(--logo-red)]"
            >
              {copy.viewBooking}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </AccountCard>
  );
}

export function BookingListCard({
  booking,
  showActions = false,
  onCancel,
  cancellingId,
  className,
}: {
  booking: BookingWithCar;
  showActions?: boolean;
  onCancel?: (booking: BookingWithCar) => void;
  cancellingId?: string | null;
  className?: string;
}) {
  const { messages, intlLocale } = useI18n();
  const { fleet } = useFleet();
  const copy = messages.account.bookings;

  const fleetKey = booking.cars?.image_url as VehicleKey | undefined;
  const vehicle = fleetKey ? getVehicle(fleet, fleetKey) : null;
  const dateRange = formatDateRange(intlLocale, booking.pickup_date, booking.return_date);
  const location = pickupLocationLabel(booking);
  const statusKey = booking.status as keyof typeof copy.status;
  const statusLabel = copy.status[statusKey] ?? booking.status;
  const paymentKey = booking.payment_status as keyof typeof copy.paymentStatus;
  const paymentLabel = copy.paymentStatus[paymentKey] ?? booking.payment_status;
  const modifiable = canModifyBooking(booking);
  const cancellable = canCancelBooking(booking);

  return (
    <AccountCard padding="none" className={cn("overflow-hidden", className)}>
      <div className="flex flex-col sm:flex-row">
        {vehicle ? (
          <FleetPhoto
            src={vehicle.image}
            alt={vehicle.name}
            className="h-44 w-full shrink-0 bg-[#f4f4f2] sm:h-auto sm:w-44 sm:min-h-[180px]"
            imgClassName="p-3"
            fit="contain"
            tint={false}
          />
        ) : (
          <div className="h-44 w-full shrink-0 bg-[#f4f4f2] sm:h-auto sm:w-44" />
        )}

        <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs font-medium text-[var(--logo-red)]">
                {copy.ref} · {bookingReference(booking)}
              </p>
              <h3 className="mt-1 font-display text-xl font-bold text-[var(--logo-black)]">
                {booking.cars?.name ?? copy.unknownVehicle}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <BookingStatusBadge label={statusLabel} variant={booking.status} />
              <BookingStatusBadge label={paymentLabel} variant={booking.payment_status} muted />
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-foreground">
              <Calendar className="size-4 text-[var(--logo-red)]" />
              <span className="font-medium">{dateRange}</span>
              <span className="text-muted-foreground">
                · {booking.pickup_time.slice(0, 5)} – {booking.return_time.slice(0, 5)}
              </span>
            </p>
            <p className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--logo-red)]" />
              <span className="line-clamp-2">{location}</span>
            </p>
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-5">
            <p className="font-display text-2xl font-bold text-[var(--logo-red)]">
              {formatPrice(Number(booking.total), intlLocale)}
            </p>

            {showActions ? (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Link
                  to="/account/bookings/$bookingId"
                  params={{ bookingId: booking.id }}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 px-4 text-sm font-semibold text-[var(--logo-black)] hover:bg-black/[0.03]"
                >
                  {copy.actions.viewDetails}
                </Link>
                {modifiable ? (
                  <Link
                    to="/account/bookings/$bookingId"
                    params={{ bookingId: booking.id }}
                    search={{ edit: "1" }}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--logo-red)] px-4 text-sm font-semibold text-white hover:bg-[#c92228]"
                  >
                    {copy.actions.manage}
                  </Link>
                ) : null}
                {cancellable && onCancel ? (
                  <button
                    type="button"
                    disabled={cancellingId === booking.id}
                    onClick={() => onCancel(booking)}
                    className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-muted-foreground hover:text-[var(--logo-red)] disabled:opacity-60"
                  >
                    {cancellingId === booking.id ? copy.actions.cancelling : copy.actions.cancel}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AccountCard>
  );
}
