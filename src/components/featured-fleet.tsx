import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { VehicleCard } from "@/components/vehicle-card";
import { VehicleDetailSheet } from "@/components/vehicle-detail-sheet";
import { useFleet } from "@/hooks/use-fleet";
import { filterFleet, type Vehicle, type VehicleFilter } from "@/lib/fleet";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function FeaturedFleet() {
  const { messages } = useI18n();
  const { fleet, fleetFilters } = useFleet();
  const [filter, setFilter] = useState<VehicleFilter>("all");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const visibleFleet = useMemo(() => filterFleet(fleet, filter), [fleet, filter]);

  const openQuickView = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSheetOpen(true);
  };

  return (
    <section className="relative bg-white px-4 py-10 sm:px-5 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-10 md:gap-6">
          <div className="max-w-2xl">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logo-red)] sm:mb-3 sm:text-xs sm:tracking-[0.2em]">
              {messages.fleet.eyebrow}
            </p>
            <h2 className="font-display text-[1.35rem] font-bold uppercase leading-[1.1] text-[var(--logo-black)] sm:text-2xl md:text-4xl">
              {messages.fleet.titleLine1}
              <br />
              {messages.fleet.titleLine2}
            </h2>
          </div>
          <Link
            to="/book"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-black/10 px-4 text-xs font-bold uppercase tracking-[0.08em] text-[var(--logo-black)] transition-colors hover:border-[var(--logo-red)] hover:text-[var(--logo-red)] sm:h-11 sm:px-5 sm:text-sm"
          >
            {messages.fleet.bookAny}
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="mb-6 flex justify-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:mb-8 [&::-webkit-scrollbar]:hidden">
          {fleetFilters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm",
                filter === item.id
                  ? "bg-[var(--logo-red)] text-white shadow-[0_8px_20px_rgb(232_40_46_0.22)]"
                  : "border border-black/10 bg-white text-black/55 hover:border-[var(--logo-red)] hover:text-[var(--logo-black)]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="md:hidden">
          <Carousel opts={{ align: "start", containScroll: "trimSnaps", loop: false }}>
            <CarouselContent className="-ml-3">
              {visibleFleet.map((vehicle) => (
                <CarouselItem key={vehicle.key} className="basis-[88%] pl-3 sm:basis-[78%]">
                  <VehicleCard vehicle={vehicle} onQuickView={openQuickView} compact />
                </CarouselItem>
              ))}
            </CarouselContent>
            {visibleFleet.length > 1 ? (
              <div className="mt-4 flex justify-center gap-2">
                <CarouselPrevious
                  className="static size-8 translate-x-0 translate-y-0"
                  srLabel={messages.common.previousSlide}
                />
                <CarouselNext
                  className="static size-8 translate-x-0 translate-y-0"
                  srLabel={messages.common.nextSlide}
                />
              </div>
            ) : null}
          </Carousel>
        </div>

        <div className="mx-auto hidden max-w-6xl gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
          {visibleFleet.map((vehicle) => (
            <VehicleCard key={vehicle.key} vehicle={vehicle} onQuickView={openQuickView} />
          ))}
        </div>
      </div>

      <VehicleDetailSheet vehicle={selectedVehicle} open={sheetOpen} onOpenChange={setSheetOpen} />
    </section>
  );
}
