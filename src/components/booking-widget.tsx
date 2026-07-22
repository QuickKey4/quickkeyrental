import { Link } from "@tanstack/react-router";
import type React from "react";
import { ArrowRight, Calendar, Car, ChevronDown } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { PremiumDateCalendar } from "@/components/premium-date-calendar";
import { useI18n } from "@/i18n/provider";
import {
  addDays,
  getDefaultPickupDate,
  getDefaultReturnDate,
  formatDisplayDate,
  startOfToday,
  toDateKey,
} from "@/lib/booking";
import type { DeliveryType } from "@/features/booking/bookingTypes";
import { cn } from "@/lib/utils";

const brandFieldClass =
  "relative flex min-w-0 flex-1 flex-col justify-center gap-1 border-b border-black/[0.08] px-4 py-3 sm:gap-1.5 sm:px-5 sm:py-4 lg:border-b-0 lg:border-r lg:px-6 lg:py-5";

const brandLabelClass =
  "inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45";

const brandValueClass =
  "w-full min-w-0 cursor-pointer appearance-none bg-transparent text-sm font-semibold text-[var(--logo-black)] outline-none sm:text-[15px]";

type BookingWidgetProps = {
  variant?: "default" | "brand";
};

export function BookingWidget({ variant = "brand" }: BookingWidgetProps) {
  const { messages, intlLocale } = useI18n();
  const m = messages.bookingWidget;
  const today = useMemo(() => startOfToday(), []);
  const vehicleSelectRef = useRef<HTMLSelectElement>(null);

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("hotel");
  const [pickupDate, setPickupDate] = useState(() => getDefaultPickupDate(today));
  const [returnDate, setReturnDate] = useState(() =>
    getDefaultReturnDate(getDefaultPickupDate(today)),
  );
  const [vehicleType, setVehicleType] = useState("all");
  const [openDateField, setOpenDateField] = useState<"pickup" | "return" | null>(null);

  const carSearch =
    vehicleType === "compact" ? "agya-1" : vehicleType === "sedan" ? "yaris-1" : undefined;

  const handlePickupDateChange = (date: Date) => {
    setPickupDate(date);
    if (returnDate <= date) {
      setReturnDate(addDays(date, 1));
    }
    setOpenDateField("return");
  };

  const handleReturnDateChange = (date: Date) => {
    setReturnDate(date);
    setOpenDateField(null);
    window.setTimeout(() => vehicleSelectRef.current?.focus(), 120);
  };

  const isBrand = variant === "brand" || variant === "default";

  if (!isBrand) return null;

  return (
    <form
      className="relative z-10 flex w-full flex-col overflow-visible rounded-lg border border-black/[0.08] bg-white shadow-[0_16px_48px_rgb(0_0_0_0.12)] lg:flex-row lg:items-stretch"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className={cn(brandFieldClass, "lg:min-w-[15rem] lg:flex-[1.15]")}>
        <span className={brandLabelClass}>{m.deliveryType}</span>
        <span className="relative block">
          <select
            value={deliveryType}
            onChange={(event) => {
              setDeliveryType(event.target.value as DeliveryType);
              window.setTimeout(() => setOpenDateField("pickup"), 120);
            }}
            aria-label={m.deliveryType}
            className={cn(brandValueClass, "pr-7")}
          >
            <option value="hotel">{m.deliveryTypes.hotel}</option>
            <option value="airport">{m.deliveryTypes.airport}</option>
            <option value="cruise">{m.deliveryTypes.cruise}</option>
            <option value="home">{m.deliveryTypes.home}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-black/35" />
        </span>
      </label>

      <WidgetDateField
        label={m.pickupDate}
        value={formatDisplayDate(pickupDate, intlLocale)}
        open={openDateField === "pickup"}
        onOpenChange={(open) => setOpenDateField(open ? "pickup" : null)}
        calendar={
          <PremiumDateCalendar
            label={m.pickupDate}
            selected={pickupDate}
            minDate={today}
            onSelect={handlePickupDateChange}
            compact
            showIntro={false}
          />
        }
      />

      <WidgetDateField
        label={m.returnDate}
        value={formatDisplayDate(returnDate, intlLocale)}
        open={openDateField === "return"}
        onOpenChange={(open) => setOpenDateField(open ? "return" : null)}
        calendar={
          <PremiumDateCalendar
            label={m.returnDate}
            selected={returnDate}
            defaultMonth={returnDate}
            minDate={addDays(pickupDate, 1)}
            onSelect={handleReturnDateChange}
            compact
            showIntro={false}
          />
        }
      />

      <label className={cn(brandFieldClass, "border-b-0 lg:min-w-[11rem]")}>
        <span className={brandLabelClass}>
          <Car className="size-3.5 text-[var(--logo-red)]" strokeWidth={2.25} />
          {m.vehicleType}
        </span>
        <span className="relative block">
          <select
            ref={vehicleSelectRef}
            value={vehicleType}
            onChange={(event) => setVehicleType(event.target.value)}
            aria-label={m.vehicleType}
            className={cn(brandValueClass, "pr-7")}
          >
            <option value="all">{m.allVehicles}</option>
            <option value="compact">{messages.fleet.filters.agya}</option>
            <option value="sedan">{messages.fleet.filters.yaris}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-black/35" />
        </span>
      </label>

      <Link
        to="/book"
        search={{
          delivery: deliveryType,
          from: toDateKey(pickupDate),
          to: toDateKey(returnDate),
          ...(carSearch ? { car: carSearch } : {}),
        }}
        className="group inline-flex min-h-[3.25rem] items-center justify-center gap-2 bg-[var(--logo-red)] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#c92228] sm:min-h-[3.75rem] sm:text-xs lg:min-h-0 lg:min-w-[12.75rem] lg:shrink-0 lg:px-8"
      >
        {m.searchVehicles}
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2.5}
        />
      </Link>
    </form>
  );
}

function WidgetDateField({
  label,
  value,
  open,
  calendar,
  onOpenChange,
}: {
  label: string;
  value: string;
  open: boolean;
  calendar: React.ReactNode;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <div className={cn(brandFieldClass, "overflow-visible")}>
      <span className={brandLabelClass}>
        <Calendar className="size-3.5 text-[var(--logo-red)]" strokeWidth={2.25} />
        {label}
      </span>
      <button
        type="button"
        aria-label={label}
        onClick={() => onOpenChange(!open)}
        className="group relative flex min-h-[1.35rem] w-full min-w-0 items-center justify-between gap-3 pr-7 text-left text-sm font-semibold text-[var(--logo-black)] outline-none transition-colors hover:text-[var(--logo-red)] focus-visible:text-[var(--logo-red)] sm:text-[15px]"
      >
        <span>{value}</span>
        <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-black/35 transition group-hover:text-[var(--logo-red)]" />
      </button>
      {open ? (
        <div className="absolute bottom-[calc(100%-0.5rem)] left-3 right-3 z-50 w-[min(21rem,calc(100vw-2rem))] rounded-[1.35rem] border border-border/80 bg-white p-3 shadow-[0_18px_48px_rgba(16,16,16,0.16)] lg:left-4 lg:right-auto">
          {calendar}
        </div>
      ) : null}
    </div>
  );
}
