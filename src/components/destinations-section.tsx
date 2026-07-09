"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Car,
  ChevronRight,
  Clock,
  Lightbulb,
  Route,
} from "lucide-react";

import { CuracaoDestinationMap } from "@/components/curacao-destination-map";
import { FleetPhoto } from "@/components/fleet-photo";
import { interpolate } from "@/i18n/interpolate";
import { useI18n } from "@/i18n/provider";
import {
  DESTINATION_IMAGES,
  DESTINATION_THUMB_IMAGES,
  ROUTE_DESTINATIONS,
  RECOMMENDED_VEHICLE,
  destinationExperienceKeys,
  type DestinationExperienceKey,
} from "@/lib/destination-experience";
import type { MapDestinationId } from "@/lib/curacao-map-locations";
import { cn } from "@/lib/utils";

const panelMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

function DestinationPicker({
  active,
  onSelect,
}: {
  active: DestinationExperienceKey;
  onSelect: (key: DestinationExperienceKey) => void;
}) {
  const { messages } = useI18n();
  const d = messages.destinations;

  return (
    <>
      <div className="hidden flex-col gap-2 lg:flex">
        {destinationExperienceKeys.map((key) => {
          const item = d.items[key];
          const isActive = active === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={isActive}
              className={cn(
                "group flex items-stretch gap-3 rounded-xl border bg-white p-2.5 text-left shadow-[0_4px_16px_rgb(0_0_0_0.04)] motion-safe:transition-all motion-safe:duration-300",
                "hover:border-[var(--logo-red)]/25 hover:shadow-[0_10px_24px_rgb(0_0_0_0.08)]",
                isActive
                  ? "border-[var(--logo-red)] ring-2 ring-[var(--logo-red)]/15"
                  : "border-black/[0.08]",
              )}
            >
              <FleetPhoto
                src={DESTINATION_THUMB_IMAGES[key]}
                alt=""
                className="size-[68px] shrink-0 rounded-lg"
                fit="cover"
                loading="lazy"
                tint={false}
              />
              <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
                <h3 className="font-display text-sm font-bold uppercase tracking-[0.02em] text-[var(--logo-black)]">
                  {item.name}
                </h3>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-black/55">
                  {item.cardTeaser}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--logo-red)]">
                  <Clock className="size-3" />
                  {interpolate(d.driveTimeShort, { minutes: item.minutes })}
                </p>
              </div>
              <ChevronRight
                className={cn(
                  "my-auto size-4 shrink-0 motion-safe:transition-transform",
                  isActive
                    ? "text-[var(--logo-red)]"
                    : "text-black/25 group-hover:translate-x-0.5",
                )}
              />
            </button>
          );
        })}
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={d.eyebrow}
      >
        {destinationExperienceKeys.map((key) => {
          const item = d.items[key];
          const isActive = active === key;

          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(key)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] motion-safe:transition-colors",
                isActive
                  ? "border-[var(--logo-red)] bg-[var(--logo-red)] text-white"
                  : "border-black/10 bg-white text-black/60",
              )}
            >
              {item.tabName}
            </button>
          );
        })}
      </div>
    </>
  );
}

function DestinationDetailPanel({ active }: { active: DestinationExperienceKey }) {
  const { messages } = useI18n();
  const d = messages.destinations;
  const item = d.items[active];
  const image = DESTINATION_IMAGES[active];
  const vehicleKey = RECOMMENDED_VEHICLE[active];

  return (
    <AnimatePresence mode="wait">
      <motion.article
        key={active}
        {...panelMotion}
        className="flex flex-col overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_12px_40px_rgb(0_0_0_0.08)]"
      >
        <div className="relative">
          <FleetPhoto
            src={image}
            alt={item.name}
            className="aspect-[2/1] max-h-40 w-full bg-[#e8e8e8] sm:max-h-44"
            fit="cover"
            loading="lazy"
            tint={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>

        <div className="flex flex-col p-4">
          <h3 className="font-display text-base font-bold uppercase tracking-[0.02em] text-[var(--logo-black)] sm:text-lg">
            {item.name}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-black/65">{item.description}</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-black/[0.06] bg-[#fafafa] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-black/40">
                {d.fields.driveTime}
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--logo-black)]">
                <Clock className="size-3.5 text-[var(--logo-red)]" />
                {interpolate(d.driveTimeFromHato, { minutes: item.minutes })}
              </p>
            </div>
            <div className="rounded-lg border border-black/[0.06] bg-[#fafafa] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-black/40">
                {d.fields.distance}
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--logo-black)]">
                <Route className="size-3.5 text-[var(--logo-red)]" />
                {interpolate(d.distanceLabel, { km: item.km })}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-[var(--logo-red)]/12 bg-[var(--logo-red)]/[0.04] px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--logo-red)]">
              {d.fields.localTip}
            </p>
            <p className="mt-1 inline-flex items-start gap-2 text-sm leading-snug text-black/70">
              <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-[var(--logo-red)]" />
              {item.localTip}
            </p>
          </div>

          <div className="mt-2.5 flex items-center gap-2 text-sm text-black/65">
            <Car className="size-4 text-[var(--logo-red)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/40">
              {d.fields.recommended}
            </span>
            <span className="font-semibold text-[var(--logo-black)]">{item.recommendedVehicle}</span>
          </div>

          <Link
            to="/book"
            search={{ car: vehicleKey }}
            className="group mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[4px] bg-[var(--logo-red)] px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#c92228]"
          >
            {d.ctaViewCars}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </motion.article>
    </AnimatePresence>
  );
}

export function DestinationsSection() {
  const { messages } = useI18n();
  const d = messages.destinations;
  const [active, setActive] = useState<DestinationExperienceKey>("westpunt");

  const driveMinutes = Object.fromEntries(
    ROUTE_DESTINATIONS.map((key) => [key, d.items[key].minutes]),
  ) as Record<MapDestinationId, string>;

  return (
    <section className="bg-[#f7f7f7] px-4 py-10 sm:px-5 md:px-8 md:py-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 max-w-2xl md:mb-8">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logo-red)] sm:mb-3 sm:text-xs sm:tracking-[0.2em]">
            {d.eyebrow}
          </p>
          <h2 className="font-display text-[1.35rem] font-bold uppercase leading-[1.08] text-[var(--logo-black)] sm:text-2xl md:text-[2.25rem]">
            {d.titleLine1}
            <br />
            <span className="text-black/55">{d.titleLine2}</span>
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-black/55">{d.subtitle}</p>
        </div>

        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,320px)] lg:items-start lg:gap-5 xl:gap-6">
          <DestinationPicker active={active} onSelect={setActive} />

          <div className="hidden min-w-0 lg:block lg:-mt-1">
            <CuracaoDestinationMap active={active} driveMinutes={driveMinutes} />
          </div>

          <div className="min-w-0 lg:-mt-1 lg:self-start">
            <DestinationDetailPanel active={active} />
          </div>
        </div>
      </div>
    </section>
  );
}
