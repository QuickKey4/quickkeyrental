import { Link } from "@tanstack/react-router";
import { ArrowRight, Cog, Fuel, Users } from "lucide-react";

import type { Vehicle } from "@/lib/fleet";
import { badgeToneClass } from "@/lib/fleet";
import { FleetPhoto } from "@/components/fleet-photo";
import { VehicleDailyRate } from "@/components/vehicle-daily-rate";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type VehicleCardProps = {
  vehicle: Vehicle;
  onQuickView: (vehicle: Vehicle) => void;
  className?: string;
  compact?: boolean;
};

export function VehicleCard({ vehicle, onQuickView, className, compact = false }: VehicleCardProps) {
  const { messages } = useI18n();

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-lg border border-black/[0.08] bg-white shadow-[0_8px_24px_rgb(0_0_0_0.06)] transition-all duration-300 hover:border-[var(--logo-red)]/30 hover:shadow-[0_12px_32px_rgb(0_0_0_0.1)]",
        className,
      )}
    >
      <div className="relative">
        <FleetPhoto
          src={vehicle.image}
          alt={vehicle.name}
          className={cn(
            "w-full bg-[#f7f7f7]",
            compact ? "aspect-[16/10] max-h-44" : "aspect-[4/3]",
          )}
          fit="cover"
          objectPosition={vehicle.imageObjectPosition ?? "center 52%"}
          imgClassName="transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
          width={1024}
          height={768}
        />
        {vehicle.badge ? (
          <span
            className={cn(
              "absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm",
              badgeToneClass[vehicle.badge.tone],
            )}
          >
            {vehicle.badge.label}
          </span>
        ) : null}
      </div>

      <div className={cn("flex flex-1 flex-col", compact ? "p-4" : "p-5")}>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/45">
          {vehicle.category}
        </p>
        <h3
          className={cn(
            "mt-1 font-display font-bold uppercase leading-tight text-[var(--logo-black)]",
            compact ? "text-base" : "text-lg",
          )}
        >
          {vehicle.name}
        </h3>

        <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-black/[0.06] py-3 text-center">
          <div>
            <dt className="sr-only">{messages.fleet.specs.seats}</dt>
            <dd className="flex flex-col items-center gap-1 text-xs text-black/55">
              <Users className="size-3.5 text-[var(--logo-red)]" />
              <span>
                {vehicle.seats} {messages.common.seats}
              </span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">{messages.fleet.specs.fuel}</dt>
            <dd className="flex flex-col items-center gap-1 text-xs text-black/55">
              <Fuel className="size-3.5 text-[var(--logo-red)]" />
              <span>{vehicle.fuel}</span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">{messages.fleet.specs.transmission}</dt>
            <dd className="flex flex-col items-center gap-1 text-xs text-black/55">
              <Cog className="size-3.5 text-[var(--logo-red)]" />
              <span className="line-clamp-2 leading-tight">{vehicle.transmission}</span>
            </dd>
          </div>
        </dl>

        <VehicleDailyRate vehicle={vehicle} className="mt-4" />

        <div className="mt-4 flex gap-2">
          <Link
            to="/book"
            search={{ car: vehicle.key }}
            className="group inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[4px] bg-[var(--logo-red)] px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#c92228] sm:gap-2 sm:text-xs sm:tracking-[0.1em]"
          >
            {messages.common.checkAvailability}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 sm:size-4" strokeWidth={2.5} />
          </Link>
          <button
            type="button"
            onClick={() => onQuickView(vehicle)}
            className="inline-flex h-11 items-center justify-center rounded-[4px] border border-black/10 px-4 text-xs font-bold uppercase tracking-[0.08em] text-[var(--logo-black)] transition-colors hover:border-[var(--logo-red)] hover:text-[var(--logo-red)]"
          >
            {messages.common.details}
          </button>
        </div>
      </div>
    </article>
  );
}
