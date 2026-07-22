import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Car,
  Check,
  Fuel,
  Gauge,
  Luggage,
  Shield,
  Snowflake,
  Truck,
  Users,
  X,
} from "lucide-react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FleetPhoto } from "@/components/fleet-photo";
import { PhotoBadge } from "@/components/photo-badge";
import type { Vehicle } from "@/lib/fleet";
import { VehicleDailyRate } from "@/components/vehicle-daily-rate";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type VehicleDetailSheetProps = {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctaLabel?: string;
  onCtaClick?: (vehicle: Vehicle) => void;
  ctaDisabled?: boolean;
};

export function VehicleDetailSheet({
  vehicle,
  open,
  onOpenChange,
  ctaLabel,
  onCtaClick,
  ctaDisabled = false,
}: VehicleDetailSheetProps) {
  const { messages } = useI18n();

  if (!vehicle) return null;

  const d = messages.fleet.detail;
  const detail = vehicle.detail;
  const specRows = [
    { label: d.labels.year, value: String(detail.year) },
    { label: d.labels.type, value: detail.bodyType },
    { label: d.labels.engine, value: detail.engine },
    { label: d.labels.transmission, value: vehicle.transmission },
    { label: d.labels.fuel, value: vehicle.fuel },
    { label: d.labels.seats, value: String(vehicle.seats) },
    { label: d.labels.doors, value: String(detail.doors) },
    { label: d.labels.luggage, value: detail.luggage },
    { label: d.labels.color, value: detail.color },
    { label: d.labels.mileage, value: detail.mileage },
    { label: d.labels.minAge, value: detail.minAge },
    { label: d.labels.license, value: detail.license, wide: true },
  ] as const;

  const quickChips = [
    { icon: Shield, label: d.chips.insurance },
    { icon: Snowflake, label: d.chips.ac },
    { icon: Gauge, label: d.chips.automatic },
    { icon: Truck, label: d.chips.delivery },
  ] as const;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideClose
        closeLabel={messages.common.close}
        className="flex h-[92dvh] max-h-[92dvh] flex-col overflow-hidden rounded-t-[1.75rem] border-border bg-surface p-0 sm:mx-auto sm:max-w-xl"
      >
        <div className="relative shrink-0 border-b border-border/60 bg-surface px-4 pb-2 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/25" aria-hidden />
          <SheetClose
            aria-label={messages.common.close}
            className="absolute right-3 top-3 inline-grid size-10 place-items-center rounded-full border border-border/60 bg-background/95 text-foreground shadow-[var(--shadow-md)] backdrop-blur-md transition-opacity hover:opacity-90"
          >
            <X className="size-5" />
          </SheetClose>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-surface [-webkit-overflow-scrolling:touch]">
          <div className="relative shrink-0">
            <FleetPhoto
              src={vehicle.image}
              alt={vehicle.name}
              className="aspect-[5/4] w-full bg-background-secondary"
              fit="cover"
              objectPosition={vehicle.imageObjectPosition ?? "center 55%"}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/10 to-foreground/20" />

            {vehicle.badge ? (
              <PhotoBadge className="absolute left-4 top-4 z-10">{vehicle.badge.label}</PhotoBadge>
            ) : null}

            <div className="absolute bottom-4 right-4 rounded-2xl px-4 py-2.5 text-right glass-strong shadow-[var(--shadow-sm)]">
              <VehicleDailyRate vehicle={vehicle} size="sheet" />
            </div>
          </div>

          <div className="flex flex-col px-5 pb-5 pt-5">
            <SheetHeader className="space-y-2 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                {vehicle.category}
              </p>
              <SheetTitle className="font-display text-2xl leading-tight md:text-[1.75rem]">
                {vehicle.name}
              </SheetTitle>
              <SheetDescription className="text-sm leading-relaxed text-muted-foreground">
                {vehicle.description}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex flex-wrap gap-2">
              {quickChips.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background-secondary/80 px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  <Icon className="size-3.5 shrink-0 text-primary" />
                  {label}
                </span>
              ))}
            </div>

            <section className="mt-6">
              <h3 className="mb-3 font-display text-base font-semibold">{d.sections.specs}</h3>
              <dl className="grid grid-cols-2 gap-2.5">
                {specRows.map(({ label, value, wide }) => (
                  <div
                    key={label}
                    className={cn(
                      "rounded-xl border border-border bg-background-secondary/50 px-3.5 py-3",
                      wide && "col-span-2",
                    )}
                  >
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium leading-snug text-foreground">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="mt-6">
              <h3 className="mb-3 font-display text-base font-semibold">{d.sections.included}</h3>
              <ul className="space-y-2.5">
                {detail.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
                    <span className="mt-0.5 inline-grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                      <Check className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-6">
              <h3 className="mb-3 font-display text-base font-semibold">{d.sections.idealFor}</h3>
              <div className="flex flex-wrap gap-2">
                {detail.idealFor.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                  >
                    <Car className="size-3.5 shrink-0" />
                    {item}
                  </span>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-border bg-background-secondary/70 p-4">
              <h3 className="mb-2 font-display text-sm font-semibold">
                {messages.fleet.requirements.title}
              </h3>
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {messages.fleet.requirements.license}
                </li>
                <li className="flex gap-2">
                  <Users className="mt-0.5 size-4 shrink-0 text-primary" />
                  {messages.fleet.requirements.age}
                </li>
                <li className="flex gap-2">
                  <Gauge className="mt-0.5 size-4 shrink-0 text-primary" />
                  {messages.fleet.requirements.experience}
                </li>
              </ul>
            </section>

            <section className="mt-4 rounded-2xl border border-border bg-background-secondary/70 p-4">
              <h3 className="mb-2 font-display text-sm font-semibold">
                {messages.fleet.insurance.title}
              </h3>
              <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <li>
                  <p className="font-semibold text-foreground">
                    {messages.fleet.insurance.depositTitle}
                  </p>
                  <p className="mt-1">{messages.fleet.insurance.depositBody}</p>
                </li>
                <li>
                  <p className="font-semibold text-foreground">
                    {messages.fleet.insurance.noDepositTitle}
                  </p>
                  <p className="mt-1">{messages.fleet.insurance.noDepositBody}</p>
                </li>
              </ul>
            </section>

            <section className="mt-4 rounded-2xl border border-border bg-background-secondary/70 p-4">
              <h3 className="mb-2 font-display text-sm font-semibold">{d.sections.goodToKnow}</h3>
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <li className="flex gap-2">
                  <Luggage className="mt-0.5 size-4 shrink-0 text-primary" />
                  {detail.luggage}
                </li>
                <li className="flex gap-2">
                  <Fuel className="mt-0.5 size-4 shrink-0 text-primary" />
                  {d.priceNote}
                </li>
                <li className="flex gap-2">
                  <Truck className="mt-0.5 size-4 shrink-0 text-primary" />
                  {d.deliveryNote}
                </li>
              </ul>
            </section>
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-surface/95 px-5 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-surface/90 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {onCtaClick ? (
            <button
              type="button"
              disabled={ctaDisabled}
              onClick={() => {
                onCtaClick(vehicle);
                onOpenChange(false);
              }}
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-[var(--logo-red)] text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#c92228] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            >
              {ctaLabel ?? messages.fleet.specs.bookVehicle}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <Link
              to="/book"
              search={{ car: vehicle.key }}
              onClick={() => onOpenChange(false)}
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-[var(--logo-red)] text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#c92228]"
            >
              {ctaLabel ?? messages.fleet.specs.bookVehicle}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
