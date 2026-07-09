import { Calendar, Fuel, Gauge, Luggage, MapPin, Settings2, Truck, Users } from "lucide-react";

import { FleetPhoto } from "@/components/fleet-photo";
import { useFleet } from "@/hooks/use-fleet";
import { formatPrice } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { getVehicle } from "@/lib/fleet";

import { vehicleBaggageCopy } from "../bookingCopy";
import type { BookingDraft } from "../bookingTypes";
import { calculateBookingTotal } from "../bookingUtils";
import { useBookingCopy } from "../useBookingCopy";

type BookingOrderSummaryProps = {
  draft: BookingDraft;
  dailyPrice: number;
  variant?: "sidebar" | "review";
};

export function BookingOrderSummary({
  draft,
  dailyPrice,
  variant = "sidebar",
}: BookingOrderSummaryProps) {
  const book = useBookingCopy();
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
  const collectionAddress = draft.sameCollectionAddress
    ? draft.deliveryAddress
    : draft.collectionAddress;
  const paidExtras = draft.selectedExtras.filter((extra) => extra.pricePerDay > 0);
  const baggage = vehicleBaggageCopy(book, draft.fleetKey);

  if (!vehicle) {
    return (
      <p className="text-sm text-muted-foreground">{book.summaryDetails.selectCarHint}</p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <FleetPhoto
          src={vehicle.image}
          alt={vehicle.name}
          className={variant === "review" ? "size-20 shrink-0 rounded-xl" : "size-16 shrink-0 rounded-xl"}
          imgClassName="p-0.5"
        />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{vehicle.category}</p>
          <p className="font-display text-sm font-bold leading-tight">{vehicle.name}</p>
        </div>
      </div>

      <div className="rounded-xl border-2 border-primary/25 bg-primary/5 p-3.5">
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2 font-semibold text-foreground">
            <Settings2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              {book.summaryDetails.transmission}: {vehicle.transmission}
            </span>
          </li>
          <li className="flex items-center gap-2 font-medium text-foreground">
            <Users className="size-4 shrink-0 text-primary" />
            {vehicle.seats} {book.summaryDetails.seats}
          </li>
          <li className="flex items-center gap-2 font-medium text-foreground">
            <Fuel className="size-4 shrink-0 text-primary" />
            {vehicle.fuel}
          </li>
        </ul>
      </div>

      {baggage ? (
        <div className="rounded-xl border border-border bg-background-secondary/50 p-3.5 text-sm">
          <p className="mb-1.5 flex items-center gap-2 font-semibold text-foreground">
            <Luggage className="size-4 shrink-0 text-primary" />
            {book.summaryDetails.baggage}
          </p>
          <p className="leading-relaxed text-muted-foreground">{baggage}</p>
        </div>
      ) : null}

      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          <Truck className="mr-1.5 inline size-3.5 text-primary" />
          {book.summaryDetails.deliver}: {book.deliveryTypes[draft.deliveryType]}
        </p>
        {draft.deliveryAddress ? (
          <p className="pl-5 text-xs leading-relaxed">{draft.deliveryAddress}</p>
        ) : null}
        {collectionAddress ? (
          <p className="pt-1">
            <MapPin className="mr-1.5 inline size-3.5 text-primary" />
            {book.summaryDetails.collect}: {collectionAddress}
          </p>
        ) : null}
        {draft.pickupDate && draft.returnDate ? (
          <p>
            <Calendar className="mr-1.5 inline size-3.5 text-primary" />
            {draft.pickupDate} · {draft.pickupTime} → {draft.returnDate} · {draft.returnTime}
          </p>
        ) : null}
      </div>

      {draft.additionalDriverEnabled ? (
        <div className="rounded-xl border border-border bg-background-secondary/50 p-3 text-sm">
          <p className="font-semibold text-foreground">{book.extras.additionalDriverTitle}</p>
          <p className="mt-1 text-muted-foreground">{draft.additionalDriverName}</p>
          <p className="text-xs text-muted-foreground">
            {book.driver.license}: {draft.additionalDriverLicense}
          </p>
        </div>
      ) : null}

      <dl className="space-y-2 border-t border-border pt-4 text-sm">
        <Row
          label={`${formatPrice(dailyPrice)} × ${totals.days} ${book.summaryDetails.days}`}
          value={formatPrice(totals.subtotal)}
        />
        {draft.insuranceOption === "daily" ? (
          <Row label={book.review.dailyInsurance} value={formatPrice(totals.insuranceCharge)} />
        ) : null}
        {paidExtras.map((extra) => (
          <Row
            key={extra.id}
            label={`${extra.name} (${formatPrice(extra.pricePerDay)}${book.perDay} × ${totals.days})`}
            value={formatPrice(extra.pricePerDay * extra.quantity * totals.days)}
          />
        ))}
        <div className="flex justify-between border-t border-border pt-3 font-semibold">
          <span>{book.review.payNowTotal}</span>
          <span className="font-display text-xl text-primary">{formatPrice(totals.total)}</span>
        </div>
        {totals.securityDeposit > 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background-secondary/60 p-3">
            <Row
              label={book.review.deposit}
              value={formatPrice(totals.securityDeposit)}
              valueClassName="text-foreground"
            />
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {book.review.depositDueAtDelivery}
            </p>
          </div>
        ) : null}
      </dl>

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs leading-relaxed text-muted-foreground">
        <p className="flex items-start gap-2 font-semibold text-foreground">
          <Gauge className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
          {book.fuelPolicy.title}
        </p>
        <p className="mt-2">{book.fuelPolicy.body}</p>
        {draft.insuranceOption === "deposit" ? (
          <p className="mt-2">{book.fuelPolicy.depositNote}</p>
        ) : null}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex justify-between gap-3 text-muted-foreground">
      <span className="min-w-0">{label}</span>
      <span className={cn("shrink-0 font-medium text-foreground", valueClassName)}>{value}</span>
    </div>
  );
}
