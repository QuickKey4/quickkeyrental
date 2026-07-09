import { formatPrice } from "@/lib/brand";
import type { Vehicle } from "@/lib/fleet";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type VehicleDailyRateProps = {
  vehicle: Vehicle;
  size?: "card" | "sheet";
  className?: string;
};

export function VehicleDailyRate({ vehicle, size = "card", className }: VehicleDailyRateProps) {
  const { messages, intlLocale } = useI18n();
  const regularPrice = vehicle.regularPrice;
  const onSale = regularPrice != null && regularPrice > vehicle.price;

  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45">
        {messages.fleet.specs.dailyRate}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline gap-2">
        {onSale ? (
          <p
            className={cn(
              "font-display font-bold leading-none text-black/35 line-through",
              size === "card" ? "text-lg" : "text-xl",
            )}
          >
            {formatPrice(regularPrice, intlLocale)}
          </p>
        ) : null}
        <p
          className={cn(
            "font-display font-bold leading-none text-[var(--logo-red)]",
            size === "card" ? "text-2xl" : "text-3xl",
          )}
        >
          {formatPrice(vehicle.price, intlLocale)}
          <span className="ml-1 text-xs font-semibold text-black/45">{messages.common.perDay}</span>
        </p>
      </div>
      {onSale ? (
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--logo-red)]">
          {messages.fleet.limitedOffer}
        </p>
      ) : null}
    </div>
  );
}
