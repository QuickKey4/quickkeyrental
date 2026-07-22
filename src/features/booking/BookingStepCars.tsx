import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { FleetPhoto } from "@/components/fleet-photo";
import { VehicleDetailSheet } from "@/components/vehicle-detail-sheet";
import { useFleet } from "@/hooks/use-fleet";
import { formatShortDate } from "@/i18n/format";
import { interpolate } from "@/i18n/interpolate";
import { useI18n } from "@/i18n/provider";
import { formatPrice } from "@/lib/brand";
import { getVehicle } from "@/lib/fleet";
import { cn } from "@/lib/utils";

import type { CarAvailability } from "./bookingTypes";
import { addDaysToDateKey, rentalDays } from "./bookingUtils";
import { useBookingCopy } from "./useBookingCopy";

type BookingStepCarsProps = {
  availability: CarAvailability[];
  selectedCarId: string | null;
  pickupDate: string;
  returnDate: string;
  availabilityReady: boolean;
  onSelect: (item: CarAvailability) => void;
  onSuggestDates: (pickupDate: string, returnDate: string) => void;
  onRetry: () => void;
  isLoading: boolean;
  isError?: boolean;
};

function formatDateKey(dateKey: string, intlLocale: string) {
  return formatShortDate(new Date(`${dateKey}T12:00:00`), intlLocale);
}

function AvailabilitySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <div key={item} className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-5 w-28 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-[4px] bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BookingStepCars({
  availability,
  selectedCarId,
  pickupDate,
  returnDate,
  availabilityReady,
  onSelect,
  onSuggestDates,
  onRetry,
  isLoading,
  isError = false,
}: BookingStepCarsProps) {
  const { fleet } = useFleet();
  const { intlLocale } = useI18n();
  const book = useBookingCopy();
  const copy = book.cars;
  const tripDays = rentalDays(pickupDate, returnDate);
  const [detailsCarId, setDetailsCarId] = useState<string | null>(null);
  const detailsItem = detailsCarId
    ? availability.find((item) => item.car.id === detailsCarId)
    : null;
  const detailsVehicle = detailsItem ? getVehicle(fleet, detailsItem.fleetKey) : null;
  const showError = isError && !isLoading;
  const showLoading = isLoading && !showError && !availabilityReady;
  const showResults = availabilityReady && !showError;

  return (
    <div>
      <h2 className="mb-1 font-display text-2xl font-bold">{copy.title}</h2>
      <p className="mb-6 text-sm text-muted-foreground">{copy.subtitle}</p>

      {showLoading ? (
        <p className="mb-4 text-sm text-muted-foreground">{copy.loadingAvailability}</p>
      ) : null}

      {showError ? (
        <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{copy.availabilityError}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 h-10 rounded-[4px] bg-[var(--logo-red)] px-4 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[var(--logo-red)]/90"
          >
            {copy.retryAvailability}
          </button>
        </div>
      ) : null}

      {showLoading ? <AvailabilitySkeleton /> : null}

      {showResults ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {availability.map((item) => {
            const vehicle = getVehicle(fleet, item.fleetKey);
            const isSelected = selectedCarId === item.car.id;
            const isSoldOut = availabilityReady && !item.available;
            const suggestedPickup = item.nextAvailableDate;
            const suggestedReturn =
              suggestedPickup && pickupDate && returnDate
                ? addDaysToDateKey(suggestedPickup, tripDays)
                : null;

            const unavailableMessage =
              isSoldOut && item.blockedThroughDate && item.nextAvailableDate
                ? interpolate(copy.unavailableHintWithResume, {
                    blockedThrough: formatDateKey(item.blockedThroughDate, intlLocale),
                    nextAvailable: formatDateKey(item.nextAvailableDate, intlLocale),
                  })
                : copy.unavailableHint;

            return (
              <div
                key={item.car.id}
                className={cn(
                  "overflow-hidden rounded-2xl border transition-colors",
                  isSelected && item.available
                    ? "border-primary bg-primary/8 shadow-[0_16px_36px_rgba(0,0,0,0.10)] ring-2 ring-primary/10"
                    : "border-border hover:border-primary/35 hover:shadow-[0_12px_28px_rgba(0,0,0,0.07)]",
                  isSoldOut && "opacity-90",
                  "transition-all duration-200 motion-safe:hover:-translate-y-0.5",
                )}
              >
                <div className="relative">
                  <FleetPhoto
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="aspect-[4/3] w-full bg-background-secondary"
                    fit="cover"
                    objectPosition={vehicle.imageObjectPosition ?? "center 52%"}
                  />
                  {isSoldOut ? (
                    <span className="absolute left-3 top-3 rounded-full bg-[var(--logo-black)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                      {book.soldOut}
                    </span>
                  ) : null}
                  {isSelected && item.available ? (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm">
                      <CheckCircle2 className="size-3" />
                      {copy.selected}
                    </span>
                  ) : null}
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {vehicle.filterLabel}
                    </p>
                    <p className="font-display text-sm font-bold leading-tight">{vehicle.name}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.category}</p>
                    <p className="mt-1 text-sm font-bold text-primary">
                      {item.baseDailyPrice > Number(item.car.daily_price) ? (
                        <>
                          <span className="mr-2 text-xs font-semibold text-muted-foreground line-through">
                            {formatPrice(item.baseDailyPrice, intlLocale)}
                          </span>
                        </>
                      ) : null}
                      {formatPrice(Number(item.car.daily_price), intlLocale)}
                      {book.perDay}
                    </p>
                    {item.discountLabel ? (
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--logo-red)]">
                        {book.limitedOffer}
                      </p>
                    ) : null}
                  </div>

                  {isSoldOut ? (
                    <div className="space-y-2">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {unavailableMessage}
                      </p>
                      {suggestedPickup && suggestedReturn ? (
                        <button
                          type="button"
                          onClick={() => onSuggestDates(suggestedPickup, suggestedReturn)}
                          className="text-left text-xs font-semibold text-primary underline-offset-2 hover:underline"
                        >
                          {interpolate(copy.trySuggestedDates, {
                            pickup: formatDateKey(suggestedPickup, intlLocale),
                            return: formatDateKey(suggestedReturn, intlLocale),
                          })}
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    disabled={isSoldOut || isLoading || !availabilityReady}
                    onClick={() => onSelect(item)}
                    className={cn(
                      "h-10 w-full rounded-[4px] text-xs font-bold uppercase tracking-[0.1em] transition-colors",
                      isSoldOut
                        ? "cursor-not-allowed bg-secondary text-muted-foreground"
                        : isSelected
                          ? "bg-[var(--logo-red)] text-white"
                          : "border border-border bg-surface hover:border-primary/40",
                      (isLoading || !availabilityReady) && !isSoldOut
                        ? "cursor-wait opacity-80"
                        : "",
                    )}
                  >
                    {!availabilityReady
                      ? copy.checkingAvailability
                      : isSoldOut
                        ? book.soldOut
                        : isSelected
                          ? copy.selected
                          : copy.select}
                  </button>
                  <button
                    type="button"
                    disabled={isLoading || !availabilityReady}
                    onClick={() => setDetailsCarId(item.car.id)}
                    className="h-10 w-full rounded-[4px] border border-border bg-transparent text-xs font-bold uppercase tracking-[0.1em] transition-colors hover:border-primary/40 disabled:cursor-wait disabled:opacity-70"
                  >
                    {copy.details}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <VehicleDetailSheet
        vehicle={detailsVehicle}
        open={Boolean(detailsVehicle)}
        onOpenChange={(open) => {
          if (!open) setDetailsCarId(null);
        }}
        ctaLabel={copy.select}
        ctaDisabled={!detailsItem?.available}
        onCtaClick={() => {
          if (detailsItem?.available) onSelect(detailsItem);
        }}
      />
    </div>
  );
}
