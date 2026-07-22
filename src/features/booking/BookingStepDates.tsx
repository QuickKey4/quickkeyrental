import { useEffect, useRef, useState } from "react";
import {
  Building2,
  CalendarDays,
  Check,
  Clock3,
  Home,
  MapPin,
  Plane,
  Ship,
  Truck,
} from "lucide-react";

import { PremiumDateCalendar } from "@/components/premium-date-calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { addDays, formatDisplayDate, parseDateKey, startOfToday } from "@/lib/booking";
import { cn } from "@/lib/utils";

import { interpolate } from "@/i18n/interpolate";

import { createDateRangePatch } from "./bookingDateRange";
import type { BookingDraft, DeliveryType } from "./bookingTypes";
import { isPickupInFutureInCuracao } from "./bookingTime";
import { deliveryAddressForType, fixedDeliveryAddress } from "./bookingValidation";
import { useBookingCopy } from "./useBookingCopy";

type BookingStepDatesProps = {
  draft: BookingDraft;
  onChange: (patch: Partial<BookingDraft>) => void;
  errors: Record<string, string>;
};

export function BookingStepDates({ draft, onChange, errors }: BookingStepDatesProps) {
  const book = useBookingCopy();
  const today = startOfToday();
  const pickupDate = parseDateKey(draft.pickupDate) ?? today;
  const returnDate = parseDateKey(draft.returnDate) ?? addDays(pickupDate, 7);
  const copy = book.dates;
  const isMobile = useIsMobile();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeDateField, setActiveDateField] = useState<"pickup" | "return">("pickup");
  const pickupTimeRef = useRef<HTMLInputElement>(null);
  const deliveryTypes: { id: DeliveryType; label: string; icon: React.ReactNode }[] = [
    { id: "hotel", label: book.deliveryTypes.hotel, icon: <Building2 className="size-4" /> },
    { id: "airport", label: book.deliveryTypes.airport, icon: <Plane className="size-4" /> },
    { id: "cruise", label: book.deliveryTypes.cruise, icon: <Ship className="size-4" /> },
    { id: "home", label: book.deliveryTypes.home, icon: <Home className="size-4" /> },
  ];
  const collectionAddress = draft.sameCollectionAddress
    ? draft.deliveryAddress
    : draft.collectionAddress;
  const fixedAddress = fixedDeliveryAddress(draft.deliveryType);
  const fixedLocationIcon =
    draft.deliveryType === "airport" ? (
      <Plane className="size-4 shrink-0 text-primary" />
    ) : draft.deliveryType === "cruise" ? (
      <Ship className="size-4 shrink-0 text-primary" />
    ) : null;

  const setDeliveryType = (type: DeliveryType) => {
    const nextAddress = deliveryAddressForType(type, draft.deliveryAddress);
    onChange({
      deliveryType: type,
      deliveryAddress: nextAddress,
      arrivingByPlane:
        type === "airport" ? true : type === "cruise" ? false : draft.arrivingByPlane,
      ...(type === "cruise" ? { flightNumber: "" } : {}),
      ...(draft.sameCollectionAddress ? { collectionAddress: nextAddress } : {}),
    });
  };

  const openDateEditor = (field: "pickup" | "return") => {
    setActiveDateField(field);
    setCalendarOpen(true);
  };

  const selectDate = (date: Date) => {
    if (activeDateField === "pickup") {
      const nextReturn = returnDate <= date ? addDays(date, 1) : returnDate;
      onChange(
        createDateRangePatch({
          range: { from: date, to: nextReturn },
          currentReturnDate: draft.returnDate,
          today,
        }) ?? {},
      );
      setActiveDateField("return");
      return;
    }

    const nextPickup = date < pickupDate ? date : pickupDate;
    const nextReturn = date < pickupDate ? addDays(date, 1) : date;
    onChange(
      createDateRangePatch({
        range: { from: nextPickup, to: nextReturn },
        currentReturnDate: draft.returnDate,
        today,
      }) ?? {},
    );
    setCalendarOpen(false);
    window.setTimeout(() => pickupTimeRef.current?.focus(), 80);
  };

  useEffect(() => {
    if (!calendarOpen) return;
    if (activeDateField === "return") return;
    setActiveDateField("pickup");
  }, [calendarOpen, activeDateField]);

  return (
    <div>
      <h2 className="mb-1 font-display text-2xl font-bold">{copy.title}</h2>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{copy.subtitle}</p>

      <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Truck className="size-5" />
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.deliveryNote}</p>
        </div>
      </div>

      <div className="mb-6 rounded-[1.5rem] border border-border/80 bg-white p-4 shadow-[0_12px_30px_rgba(16,16,16,0.04)] md:p-5">
        <SectionHeading
          eyebrow={copy.guidance.deliveryEyebrow}
          title={copy.deliveryType}
          body={copy.guidance.deliveryBody}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          {deliveryTypes.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setDeliveryType(option.id)}
              className={cn(
                "group flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all duration-200 motion-reduce:transition-none",
                draft.deliveryType === option.id
                  ? "border-primary/35 bg-primary/10 text-primary shadow-[0_10px_22px_rgba(232,40,46,0.08)]"
                  : "border-border bg-background-secondary/60 text-muted-foreground hover:border-primary/30 hover:bg-white hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-xl transition-colors",
                    draft.deliveryType === option.id
                      ? "bg-primary text-white"
                      : "bg-white text-primary",
                  )}
                >
                  {option.icon}
                </span>
                {option.label}
              </span>
              {draft.deliveryType === option.id ? <Check className="size-4" /> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-[1.5rem] border border-border/80 bg-white p-4 shadow-[0_12px_30px_rgba(16,16,16,0.04)] md:p-5">
        <SectionHeading
          eyebrow={copy.guidance.addressEyebrow}
          title={copy.deliveryAddress}
          body={copy.guidance.addressBody}
        />
        <div className="space-y-4">
          <label className="flex flex-col gap-1.5" data-booking-field="deliveryAddress">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <RequiredLabel>{copy.deliveryAddress}</RequiredLabel>
            </span>
            {fixedAddress ? (
              <div className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-background-secondary/80 px-4 py-3">
                {fixedLocationIcon}
                <span className="text-sm font-medium text-foreground">{fixedAddress}</span>
              </div>
            ) : (
              <Textarea
                value={draft.deliveryAddress}
                onChange={(event) => {
                  const value = event.target.value;
                  onChange({
                    deliveryAddress: value,
                    ...(draft.sameCollectionAddress ? { collectionAddress: value } : {}),
                  });
                }}
                placeholder={copy.deliveryAddressPlaceholder}
                rows={3}
                aria-invalid={Boolean(errors.deliveryAddress)}
                className={cn(
                  "min-h-[5.5rem] rounded-xl bg-background-secondary px-4 py-3 text-base shadow-none focus-visible:ring-primary sm:text-sm",
                  errors.deliveryAddress ? "border-destructive/60" : "border-border",
                )}
              />
            )}
            {draft.deliveryType === "airport" ? (
              <span className="text-xs text-muted-foreground">{copy.airportAddressHint}</span>
            ) : null}
            {draft.deliveryType === "cruise" ? (
              <span className="text-xs text-muted-foreground">{copy.cruiseAddressHint}</span>
            ) : null}
            {errors.deliveryAddress ? (
              <span className="text-sm text-destructive">{errors.deliveryAddress}</span>
            ) : null}
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-border bg-background-secondary/60 p-4">
            <input
              type="checkbox"
              checked={draft.sameCollectionAddress}
              onChange={(event) =>
                onChange({
                  sameCollectionAddress: event.target.checked,
                  collectionAddress: event.target.checked
                    ? draft.deliveryAddress
                    : draft.collectionAddress,
                })
              }
              className="mt-1 size-4 rounded border-border"
            />
            <span className="text-sm">{copy.sameCollectionAddress}</span>
          </label>

          {!draft.sameCollectionAddress ? (
            <label className="flex flex-col gap-1.5" data-booking-field="collectionAddress">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <RequiredLabel>{copy.collectionAddress}</RequiredLabel>
              </span>
              <Textarea
                value={draft.collectionAddress}
                onChange={(event) => onChange({ collectionAddress: event.target.value })}
                placeholder={copy.collectionAddressPlaceholder}
                rows={3}
                aria-invalid={Boolean(errors.collectionAddress)}
                className={cn(
                  "min-h-[5.5rem] rounded-xl bg-background-secondary px-4 py-3 text-base shadow-none focus-visible:ring-primary sm:text-sm",
                  errors.collectionAddress ? "border-destructive/60" : "border-border",
                )}
              />
              {errors.collectionAddress ? (
                <span className="text-sm text-destructive">{errors.collectionAddress}</span>
              ) : null}
            </label>
          ) : null}
        </div>
      </div>

      <div className="mb-6 rounded-[1.75rem] border border-border/80 bg-gradient-to-br from-white via-white to-background-secondary/70 p-4 shadow-[0_18px_44px_rgba(16,16,16,0.07)] md:p-5">
        <SectionHeading
          eyebrow={copy.guidance.datesEyebrow}
          title={copy.guidance.datesTitle}
          body={copy.guidance.datesBody}
        />
        <DateRangeEditor
          activeField={activeDateField}
          calendarOpen={calendarOpen}
          isMobile={isMobile}
          pickupDate={pickupDate}
          returnDate={returnDate}
          today={today}
          pickupLabel={copy.pickupDate}
          returnLabel={copy.returnDate}
          title={copy.guidance.datesTitle}
          body={copy.guidance.datesBody}
          onOpenChange={setCalendarOpen}
          onOpenField={openDateEditor}
          onSelectDate={selectDate}
        />
      </div>

      <div className="rounded-[1.5rem] border border-border/80 bg-white p-4 shadow-[0_12px_30px_rgba(16,16,16,0.04)] md:p-5">
        <SectionHeading
          eyebrow={copy.guidance.timeEyebrow}
          title={copy.guidance.timeTitle}
          body={copy.guidance.timeBody}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TimeField
            label={copy.pickupTime}
            fieldName="pickupTime"
            value={draft.pickupTime}
            onChange={(value) => onChange({ pickupTime: value })}
            inputRef={pickupTimeRef}
            error={
              errors.pickupTime ||
              (!isPickupInFutureInCuracao(draft.pickupDate, draft.pickupTime)
                ? book.errors.pickupInPast
                : undefined)
            }
          />
          <TimeField
            label={copy.returnTime}
            fieldName="returnTime"
            value={draft.returnTime}
            onChange={(value) => onChange({ returnTime: value })}
          />
        </div>
      </div>

      {collectionAddress.trim() ? (
        <p className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-background-secondary/60 p-3 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>{interpolate(copy.collectionPreview, { address: collectionAddress.trim() })}</span>
        </p>
      ) : null}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mb-4">
      <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-primary/80">
        {eyebrow}
      </p>
      <h3 className="font-display text-lg font-bold text-[var(--logo-black)]">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function DateSummaryCard({
  label,
  fieldName,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  fieldName: string;
  value: string;
  tone: "pickup" | "return";
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-2xl border px-4 py-3 text-left transition-all duration-200 motion-reduce:transition-none",
        active
          ? "border-primary/45 bg-primary/10 shadow-[0_12px_26px_rgba(232,40,46,0.1)]"
          : tone === "pickup"
            ? "border-primary/25 bg-primary/5"
            : "border-border bg-background-secondary/70",
      )}
    >
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-2 flex items-center gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            tone === "pickup" ? "bg-primary text-white" : "bg-primary/10 text-primary",
          )}
        >
          <CalendarDays className="size-4" />
        </span>
        <span className="min-w-0 text-sm font-semibold text-foreground">{value}</span>
      </div>
    </button>
  );
}

function DateRangeEditor({
  activeField,
  calendarOpen,
  isMobile,
  pickupDate,
  returnDate,
  today,
  pickupLabel,
  returnLabel,
  title,
  body,
  onOpenChange,
  onOpenField,
  onSelectDate,
}: {
  activeField: "pickup" | "return";
  calendarOpen: boolean;
  isMobile: boolean;
  pickupDate: Date;
  returnDate: Date;
  today: Date;
  pickupLabel: string;
  returnLabel: string;
  title: string;
  body: string;
  onOpenChange: (open: boolean) => void;
  onOpenField: (field: "pickup" | "return") => void;
  onSelectDate: (date: Date) => void;
}) {
  const cards = (
    <div className="grid gap-3 sm:grid-cols-2">
      <DateSummaryCard
        tone="pickup"
        label={pickupLabel}
        value={formatDisplayDate(pickupDate)}
        active={calendarOpen && activeField === "pickup"}
        onClick={() => onOpenField("pickup")}
      />
      <DateSummaryCard
        tone="return"
        label={returnLabel}
        value={formatDisplayDate(returnDate)}
        active={calendarOpen && activeField === "return"}
        onClick={() => onOpenField("return")}
      />
    </div>
  );

  const calendar = (field: "pickup" | "return") => (
    <PremiumDateCalendar
      label={field === "pickup" ? pickupLabel : returnLabel}
      selected={field === "pickup" ? pickupDate : returnDate}
      defaultMonth={field === "pickup" ? pickupDate : returnDate}
      minDate={field === "pickup" ? today : addDays(pickupDate, 1)}
      onSelect={onSelectDate}
      compact
      showIntro={false}
    />
  );

  if (isMobile) {
    return (
      <>
        {cards}
        <Dialog open={calendarOpen} onOpenChange={onOpenChange}>
          <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-t-[1.75rem] p-4 sm:rounded-[1.75rem]">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{body}</DialogDescription>
            </DialogHeader>
            {calendar(activeField)}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-3">
        <DateSummaryCard
          tone="pickup"
          label={pickupLabel}
          value={formatDisplayDate(pickupDate)}
          active={calendarOpen && activeField === "pickup"}
          onClick={() => onOpenField("pickup")}
        />
        {calendarOpen && activeField === "pickup" ? (
          <div className="w-full rounded-[1.35rem] border border-border/80 bg-white p-3 shadow-[0_20px_56px_rgba(16,16,16,0.12)]">
            {calendar("pickup")}
          </div>
        ) : null}
      </div>
      <div className="space-y-3">
        <DateSummaryCard
          tone="return"
          label={returnLabel}
          value={formatDisplayDate(returnDate)}
          active={calendarOpen && activeField === "return"}
          onClick={() => onOpenField("return")}
        />
        {calendarOpen && activeField === "return" ? (
          <div className="w-full rounded-[1.35rem] border border-border/80 bg-white p-3 shadow-[0_20px_56px_rgba(16,16,16,0.12)]">
            {calendar("return")}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TimeField({
  label,
  fieldName,
  value,
  onChange,
  error,
  inputRef,
}: {
  label: string;
  fieldName: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <label className="flex flex-col gap-1.5" data-booking-field={fieldName}>
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        <RequiredLabel>{label}</RequiredLabel>
      </span>
      <span
        className={cn(
          "flex h-12 items-center gap-3 rounded-xl border bg-background-secondary px-4 focus-within:border-primary",
          error ? "border-destructive/60" : "border-border",
        )}
      >
        <Clock3 className="size-4 text-primary" />
        <input
          ref={inputRef}
          type="time"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          className="w-full bg-transparent text-base outline-none sm:text-sm"
        />
      </span>
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
    </label>
  );
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}{" "}
      <span className="text-destructive" aria-label="required">
        *
      </span>
    </>
  );
}
