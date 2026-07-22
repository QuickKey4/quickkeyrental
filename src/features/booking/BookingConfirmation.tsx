import { AlertTriangle, Check, Clock3, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { FleetPhoto } from "@/components/fleet-photo";
import { useFleet } from "@/hooks/use-fleet";
import { formatDateRange } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
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
  paymentState?: "checking" | "confirmed" | "pending" | "failed";
  onRetryPayment?: () => void;
};

export function BookingConfirmation({
  draft,
  dailyPrice,
  bookingReference,
  payAtArrival = false,
  paymentState = "confirmed",
  onRetryPayment,
}: BookingConfirmationProps) {
  const { fleet } = useFleet();
  const { intlLocale } = useI18n();
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
  const customerName = draft.guestFirstName || draft.guestName || "";
  const rentalPeriod =
    draft.pickupDate && draft.returnDate
      ? `${formatDateRange(intlLocale, draft.pickupDate, draft.returnDate)} · ${draft.pickupTime} → ${draft.returnTime}`
      : "";
  const collectionAddress = draft.sameCollectionAddress
    ? draft.deliveryAddress
    : draft.collectionAddress;
  const isConfirmed = paymentState === "confirmed";
  const isPending = paymentState === "pending";
  const isChecking = paymentState === "checking";
  const isFailed = paymentState === "failed";
  const stateTitle = isChecking
    ? copy.checkingTitle
    : isPending
      ? copy.pendingTitle
      : isFailed
        ? copy.failedTitle
        : copy.title;
  const stateSubtitle = isChecking
    ? copy.checkingSubtitle
    : isPending
      ? copy.subtitlePaymentPending
      : isFailed
        ? copy.failedSubtitle
        : payAtArrival
          ? copy.subtitlePayAtArrival
          : copy.subtitle;

  return (
    <div className="rounded-3xl border border-border bg-surface p-10 text-center shadow-[var(--shadow-lg)] md:p-16">
      <div
        className={`mb-6 inline-grid size-16 place-items-center rounded-2xl ${
          isConfirmed
            ? "bg-success/15 text-success"
            : isPending || isChecking
              ? "bg-amber-100 text-amber-700"
              : "bg-destructive/10 text-destructive"
        }`}
      >
        {isChecking ? (
          <Loader2 className="size-8 animate-spin" />
        ) : isPending ? (
          <Clock3 className="size-8" />
        ) : isFailed ? (
          <AlertTriangle className="size-8" />
        ) : (
          <Check className="size-8" />
        )}
      </div>
      <h1 className="mb-3 font-display text-4xl font-bold md:text-5xl">{stateTitle}</h1>
      {customerName && isConfirmed ? (
        <p className="mx-auto mb-3 max-w-md font-semibold text-foreground">
          {interpolate(copy.greeting, { name: customerName })}
        </p>
      ) : null}
      <p className="mx-auto mb-8 max-w-md text-muted-foreground">{stateSubtitle}</p>

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
            <p className="text-sm text-muted-foreground">{rentalPeriod}</p>
          </div>
        </div>
      ) : null}

      <dl className="mx-auto mb-8 grid max-w-md gap-3 rounded-2xl border border-border bg-background-secondary/50 p-5 text-left text-sm">
        {vehicle ? <SummaryRow label={copy.vehicle} value={vehicle.name} /> : null}
        {rentalPeriod ? <SummaryRow label={copy.rentalPeriod} value={rentalPeriod} /> : null}
        <SummaryRow
          label={copy.delivery}
          value={`${book.deliveryTypes[draft.deliveryType]}${draft.deliveryAddress ? ` · ${draft.deliveryAddress}` : ""}`}
        />
        {collectionAddress ? (
          <SummaryRow label={copy.collection} value={collectionAddress} />
        ) : null}
        <SummaryRow
          label={isConfirmed ? copy.paidTotal : copy.paymentPendingTotal}
          value={formatPrice(totals.total)}
          strong
        />
      </dl>

      <p className="mb-8 text-sm text-muted-foreground">
        {copy.reference}:{" "}
        <span className="font-mono font-semibold text-foreground">{bookingReference}</span>
      </p>

      {draft.bookingId && isConfirmed ? (
        <BookingAccountPrompt guestEmail={draft.guestEmail} bookingId={draft.bookingId} />
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {isFailed && onRetryPayment ? (
          <button
            type="button"
            onClick={onRetryPayment}
            className="inline-flex h-12 items-center gap-2 rounded-[4px] bg-[var(--logo-red)] px-6 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#c92228]"
          >
            {copy.tryPaymentAgain}
          </button>
        ) : null}
        <Link
          to="/"
          className="inline-flex h-12 items-center gap-2 rounded-[4px] border border-border bg-white px-6 text-xs font-bold uppercase tracking-[0.1em] text-foreground transition-colors hover:bg-black/[0.03]"
        >
          {book.backHome}
        </Link>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd
        className={strong ? "font-display font-bold text-primary" : "font-medium text-foreground"}
      >
        {value}
      </dd>
    </div>
  );
}
