"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Compass, MapPin, Palmtree, Sun } from "lucide-react";

import { FleetPhoto } from "@/components/fleet-photo";
import { PhotoBadge } from "@/components/photo-badge";
import { useI18n } from "@/i18n/provider";
import { FLEET_IMAGES } from "@/lib/fleet-images";
import { holidayMomentKeys, type HolidayMomentKey } from "@/lib/holiday-moments";
import { cn } from "@/lib/utils";

const momentIcons: Record<HolidayMomentKey, typeof Sun> = {
  beach: Palmtree,
  town: MapPin,
  coast: Compass,
  handover: Sun,
};

const momentImages: Record<HolidayMomentKey, string> = {
  beach: FLEET_IMAGES.momentBeachMambo,
  town: FLEET_IMAGES.momentWillemstad,
  coast: FLEET_IMAGES.momentCoastline,
  handover: FLEET_IMAGES.agyaAirportCurThumb,
};

function MomentImagePanel({
  momentKey,
  className,
}: {
  momentKey: HolidayMomentKey;
  className?: string;
}) {
  const { messages } = useI18n();
  const moment = messages.whyChoose.moments[momentKey];

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-lg border border-black/[0.08] shadow-[0_10px_28px_rgb(0_0_0_0.08)]">
        <div className="relative aspect-[16/10] w-full bg-[#e8e8e8]">
          <FleetPhoto
            src={momentImages[momentKey]}
            alt={moment.title}
            className="absolute inset-0 h-full w-full"
            fit="cover"
            imgClassName="object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--logo-black)]/45 via-transparent to-transparent" />
          <PhotoBadge showDot className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] sm:bottom-4 sm:left-4">
            {moment.title}
          </PhotoBadge>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-black/55">{moment.body}</p>
    </div>
  );
}

function MomentCard({
  momentKey,
  isActive,
  onSelect,
}: {
  momentKey: HolidayMomentKey;
  isActive: boolean;
  onSelect: () => void;
}) {
  const { messages } = useI18n();
  const moment = messages.whyChoose.moments[momentKey];
  const Icon = momentIcons[momentKey];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      aria-expanded={isActive}
      className={cn(
        "w-full rounded-lg border bg-white p-4 text-left shadow-[0_4px_16px_rgb(0_0_0_0.04)] motion-safe:transition-all motion-safe:duration-300",
        "hover:-translate-y-0.5 hover:border-[var(--logo-red)]/25 hover:shadow-[0_10px_24px_rgb(0_0_0_0.08)]",
        isActive
          ? "border-[var(--logo-red)]/40 ring-2 ring-[var(--logo-red)]/15"
          : "border-black/[0.08]",
      )}
    >
      <div
        className={cn(
          "mb-3 inline-grid size-9 place-items-center rounded-md motion-safe:transition-colors",
          isActive ? "bg-[var(--logo-red)] text-white" : "bg-[var(--logo-red)]/10 text-[var(--logo-red)]",
        )}
      >
        <Icon className="size-4" />
      </div>
      <h3 className="font-display text-sm font-bold uppercase tracking-[0.02em] text-[var(--logo-black)] sm:text-base">
        {moment.title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-black/60">{moment.body}</p>
    </button>
  );
}

export function WhyChoose() {
  const { messages } = useI18n();
  const w = messages.whyChoose;
  const [active, setActive] = useState<HolidayMomentKey>("beach");

  return (
    <section className="bg-[#f7f7f7] px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 max-w-2xl md:mb-10">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logo-red)] sm:mb-3 sm:text-xs sm:tracking-[0.2em]">
            {w.eyebrow}
          </p>
          <h2 className="font-display text-[1.75rem] font-bold uppercase leading-[1.02] text-[var(--logo-black)] sm:text-3xl md:text-4xl">
            {w.titleLine1}
            <br />
            <span className="text-[var(--logo-red)]">{w.titleLine2}</span>
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-black/65 sm:text-base">{w.subtitle}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-black/40">
            {w.pickHint}
          </p>
        </div>

        {/* Mobile: image drops down under the active card */}
        <div className="flex flex-col gap-2.5 lg:hidden">
          {holidayMomentKeys.map((key) => {
            const isActive = active === key;

            return (
              <div key={key}>
                <MomentCard momentKey={key} isActive={isActive} onSelect={() => setActive(key)} />
                <AnimatePresence initial={false}>
                  {isActive ? (
                    <motion.div
                      key={`panel-${key}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <MomentImagePanel momentKey={key} className="pt-2.5" />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Desktop: cards left, sticky image right */}
        <div className="hidden items-start gap-8 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.75fr)] lg:gap-10">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {holidayMomentKeys.map((key) => (
              <MomentCard
                key={key}
                momentKey={key}
                isActive={active === key}
                onSelect={() => setActive(key)}
              />
            ))}
          </div>

          <div className="sticky top-28">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <MomentImagePanel momentKey={active} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <Link
          to="/book"
          className="group mt-8 inline-flex h-11 items-center gap-2 rounded-[4px] bg-[var(--logo-red)] px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#c92228]"
        >
          {w.cta}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
