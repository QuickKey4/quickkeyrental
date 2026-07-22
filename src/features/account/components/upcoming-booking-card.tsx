import { Link } from "@tanstack/react-router";
import { Calendar, CheckCircle2, Clock, FileText, MapPin, MessageCircle } from "lucide-react";

import { FleetPhoto } from "@/components/fleet-photo";
import { useFleet } from "@/hooks/use-fleet";
import { useI18n } from "@/i18n/provider";
import { formatDateRange } from "@/i18n/format";
import type { BookingWithCar } from "@/features/account/account-queries";
import { formatPrice } from "@/lib/brand";
import { getVehicle } from "@/lib/fleet";
import type { VehicleKey } from "@/lib/fleet";

import {
  bookingReference,
  canCancelBooking,
  canModifyBooking,
  pickupLocationLabel,
} from "../account-utils";
import { BookingInsuranceSummary } from "./booking-insurance-summary";
import { AccountCard } from "./account-ui";
import { BookingStatusBadge } from "./booking-status-badge";

type UpcomingBookingCardProps = {
  booking: BookingWithCar;
  onCancel?: (booking: BookingWithCar) => void;
  cancellingId?: string | null;
};

export function UpcomingBookingCard({ booking, onCancel, cancellingId }: UpcomingBookingCardProps) {
  const { messages, intlLocale } = useI18n();
  const { fleet } = useFleet();
  const copy = messages.account.dashboard;
  const bookingsCopy = messages.account.bookings;

  const fleetKey = booking.cars?.image_url as VehicleKey | undefined;
  const vehicle = fleetKey ? getVehicle(fleet, fleetKey) : null;
  const modifiable = canModifyBooking(booking);
  const cancellable = canCancelBooking(booking);
  const statusKey = booking.status as keyof typeof bookingsCopy.status;
  const statusLabel = bookingsCopy.status[statusKey] ?? booking.status;
  const dateRange = formatDateRange(intlLocale, booking.pickup_date, booking.return_date);
  const [pickupDate, returnDate] = dateRange.split(" – ");
  const pickupLocation = pickupLocationLabel(booking);
  const returnLocation = booking.collection_address?.trim() || pickupLocation;

  return (
    <AccountCard padding="none" className="overflow-hidden">
      <div className="border-b border-black/[0.05] bg-gradient-to-br from-white to-[#fafafa] px-4 py-4 sm:px-8 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {copy.upcomingTitle}
            </p>
            <p className="mt-1 font-mono text-sm font-medium text-[var(--logo-red)]">
              {copy.bookingRef} · {bookingReference(booking)}
            </p>
          </div>
          <BookingStatusBadge label={statusLabel} variant={booking.status} />
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-8 lg:grid-cols-[240px_1fr] lg:items-start">
        {vehicle ? (
          <FleetPhoto
            src={vehicle.image}
            alt={vehicle.name}
            className="mx-auto aspect-[4/3] w-full max-w-[280px] rounded-2xl bg-[#f4f4f2] lg:max-w-none"
            imgClassName="p-3"
            fit="contain"
            tint={false}
          />
        ) : (
          <div className="aspect-[4/3] w-full rounded-2xl bg-[#f4f4f2] lg:col-span-1" />
        )}

        <div className="min-w-0">
          <h3 className="font-display text-2xl font-bold tracking-tight text-[var(--logo-black)] sm:text-3xl">
            {booking.cars?.name ?? bookingsCopy.unknownVehicle}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{copy.tripReadyHint}</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <StatusPill icon={CheckCircle2} label={copy.statusItems.booking} />
            <StatusPill icon={FileText} label={copy.statusItems.documents} />
            <StatusPill icon={MessageCircle} label={copy.statusItems.support} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <TripBlock
              label={copy.pickupLabel}
              date={pickupDate}
              time={booking.pickup_time.slice(0, 5)}
              location={pickupLocation}
            />
            <TripBlock
              label={copy.returnLabel}
              date={returnDate ?? booking.return_date}
              time={booking.return_time.slice(0, 5)}
              location={returnLocation}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-black/[0.06] pt-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {copy.totalLabel}
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-[var(--logo-red)]">
                {formatPrice(Number(booking.total), intlLocale)}
              </p>
            </div>
          </div>

          {booking.insurance_option ? (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {copy.insuranceReminderTitle}
              </p>
              <BookingInsuranceSummary booking={booking} compact />
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {modifiable ? (
              <Link
                to="/account/bookings/$bookingId"
                params={{ bookingId: booking.id }}
                search={{ edit: "1" }}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-[var(--logo-red)] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(232,40,46,0.22)] transition-all hover:bg-[#c92228]"
              >
                {copy.manageBooking}
              </Link>
            ) : null}
            <Link
              to="/account/bookings/$bookingId"
              params={{ bookingId: booking.id }}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-black/10 bg-white text-sm font-semibold text-[var(--logo-black)] transition-colors hover:bg-black/[0.03]"
            >
              {copy.viewBooking}
            </Link>
          </div>

          {cancellable && onCancel ? (
            <button
              type="button"
              disabled={cancellingId === booking.id}
              onClick={() => onCancel(booking)}
              className="mt-3 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-[var(--logo-red)] hover:underline disabled:opacity-60"
            >
              {cancellingId === booking.id
                ? bookingsCopy.actions.cancelling
                : bookingsCopy.actions.cancel}
            </button>
          ) : null}
          {!modifiable && cancellable ? (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {bookingsCopy.modifyWindowClosed}
            </p>
          ) : null}
        </div>
      </div>
    </AccountCard>
  );
}

function TripBlock({
  label,
  date,
  time,
  location,
}: {
  label: string;
  date: string;
  time: string;
  location: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f8f8f6] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 space-y-1.5 text-sm">
        <p className="flex items-center gap-2 font-semibold text-[var(--logo-black)]">
          <Calendar className="size-4 text-[var(--logo-red)]" />
          {date}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4 text-[var(--logo-red)]" />
          {time}
        </p>
        <p className="flex items-start gap-2 text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--logo-red)]" />
          <span className="line-clamp-2">{location}</span>
        </p>
      </div>
    </div>
  );
}

function StatusPill({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-black/[0.06] bg-white px-3 py-2 text-sm font-semibold text-[var(--logo-black)] shadow-[0_2px_10px_rgba(16,16,16,0.04)]">
      <Icon className="size-4 shrink-0 text-[var(--logo-red)]" />
      <span className="min-w-0 leading-tight">{label}</span>
    </div>
  );
}
