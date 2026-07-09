import { Check } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { FleetPhoto } from "@/components/fleet-photo";
import { useFleet } from "@/hooks/use-fleet";
import { formatPrice } from "@/lib/brand";
import { getVehicle } from "@/lib/fleet";

import { interpolate } from "@/i18n/interpolate";

import { BookingAccountPrompt } from "./components/BookingAccountPrompt";
import type { BookingDraft } from "./bookingTypes";
import { calculateBookingTotal } from "./bookingUtils";
import { useBookingCopy } from "./useBookingCopy";

type BookingConfirmationProps = {
  draft: BookingDraft;
  dailyPrice: number;
  bookingReference: string;
  payAtArrival?: boolean;
  paymentPending?: boolean;
};

export function BookingConfirmation({
  draft,
  dailyPrice,
  bookingReference,
  payAtArrival = false,
  paymentPending = false,
}: BookingConfirmationProps) {
  const { fleet } = useFleet();
  const vehicle = draft.fleetKey ? getVehicle(fleet, draft.fleetKey) : null;
  const totals = calculateBookingTotal(
    dailyPrice,
    draft.selectedExtras,
    draft.pickupDate,
    draft.returnDate,
    draft.insuranceOption,
    draft.fleetKey,
  );
  const book = useBookingCopy();
  const copy = book.confirmation;

  return (
    <div className="rounded-3xl border border-border bg-surface p-10 text-center shadow-[var(--shadow-lg)] md:p-16">
      <div className="mb-6 inline-grid size-16 place-items-center rounded-2xl bg-success/15 text-success">
        <Check className="size-8" />
      </div>
      <h1 className="mb-3 font-display text-4xl font-bold md:text-5xl">{copy.title}</h1>
      <p className="mx-auto mb-8 max-w-md text-muted-foreground">
        {paymentPending
          ? copy.subtitlePaymentPending
          : payAtArrival
            ? copy.subtitlePayAtArrival
            : copy.subtitle}
      </p>

      {vehicle ? (
        <div className="mx-auto mb-8 flex max-w-md items-center gap-4 rounded-2xl border border-border p-4 text-left">
          <FleetPhoto
            src={vehicle.image}
            alt={vehicle.name}
            className="size-16 shrink-0 rounded-xl"
            imgClassName="p-0.5"
          />
          <div>
            <p className="font-display font-bold">{vehicle.name}</p>
            <p className="text-sm text-muted-foreground">
              {interpolate(copy.deliverCollect, {
                pickup: draft.pickupDate,
                return: draft.returnDate,
              })}
            </p>
            <p className="mt-1 text-sm font-semibold text-primary">{formatPrice(totals.total)}</p>
          </div>
        </div>
      ) : null}

      <p className="mb-8 text-sm text-muted-foreground">
        {copy.reference}: <span className="font-mono font-semibold text-foreground">{bookingReference}</span>
      </p>

      {draft.bookingId ? (
        <BookingAccountPrompt guestEmail={draft.guestEmail} bookingId={draft.bookingId} />
      ) : null}

      <Link
        to="/"
        className="mt-8 inline-flex h-12 items-center gap-2 rounded-[4px] bg-[var(--logo-red)] px-6 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#c92228]"
      >
        {book.backHome}
      </Link>
    </div>
  );
}
