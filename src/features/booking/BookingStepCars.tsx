import { FleetPhoto } from "@/components/fleet-photo";
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
  isLoading: boolean;
  isError?: boolean;
};

function formatDateKey(dateKey: string, intlLocale: string) {
  return formatShortDate(new Date(`${dateKey}T12:00:00`), intlLocale);
}

export function BookingStepCars({
  availability,
  selectedCarId,
  pickupDate,
  returnDate,
  availabilityReady,
  onSelect,
  onSuggestDates,
  isLoading,
  isError = false,
}: BookingStepCarsProps) {
  const { fleet } = useFleet();
  const { intlLocale } = useI18n();
  const book = useBookingCopy();
  const copy = book.cars;
  const tripDays = rentalDays(pickupDate, returnDate);

  return (
    <div>
      <h2 className="mb-1 font-display text-2xl font-bold">{copy.title}</h2>
      <p className="mb-6 text-sm text-muted-foreground">{copy.subtitle}</p>

      {isLoading ? (
        <p className="mb-4 text-sm text-muted-foreground">{copy.loadingAvailability}</p>
      ) : null}

      {isError ? (
        <p className="mb-4 text-sm text-destructive">{copy.availabilityError}</p>
      ) : null}

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
                  ? "border-primary bg-primary/8"
                  : "border-border",
                isSoldOut && "opacity-90",
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
                    <p className="text-xs leading-relaxed text-muted-foreground">{unavailableMessage}</p>
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
