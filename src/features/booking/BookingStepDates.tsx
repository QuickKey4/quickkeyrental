import { Building2, Calendar, Home, Plane, Ship, Truck } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import {
  addDays,
  normalizePickupDate,
  normalizeReturnDate,
  parseDateKey,
  startOfToday,
  toDateKey,
} from "@/lib/booking";
import { cn } from "@/lib/utils";

import { interpolate } from "@/i18n/interpolate";

import type { BookingDraft, DeliveryType } from "./bookingTypes";
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
      ...(draft.sameCollectionAddress ? { collectionAddress: nextAddress } : {}),
    });
  };

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

      <div className="mb-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {copy.deliveryType}
        </p>
        <div className="flex flex-wrap gap-2">
          {deliveryTypes.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setDeliveryType(option.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                draft.deliveryType === option.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:border-primary/35 hover:text-foreground",
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {copy.deliveryAddress}
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
              className="min-h-[5.5rem] rounded-xl border-border bg-background-secondary px-4 py-3 text-sm shadow-none focus-visible:ring-primary"
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
                collectionAddress: event.target.checked ? draft.deliveryAddress : draft.collectionAddress,
              })
            }
            className="mt-1 size-4 rounded border-border"
          />
          <span className="text-sm">{copy.sameCollectionAddress}</span>
        </label>

        {!draft.sameCollectionAddress ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {copy.collectionAddress}
            </span>
            <Textarea
              value={draft.collectionAddress}
              onChange={(event) => onChange({ collectionAddress: event.target.value })}
              placeholder={copy.collectionAddressPlaceholder}
              rows={3}
              className="min-h-[5.5rem] rounded-xl border-border bg-background-secondary px-4 py-3 text-sm shadow-none focus-visible:ring-primary"
            />
            {errors.collectionAddress ? (
              <span className="text-sm text-destructive">{errors.collectionAddress}</span>
            ) : null}
          </label>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DateField
          label={copy.pickupDate}
          value={draft.pickupDate}
          min={toDateKey(today)}
          onChange={(value) => {
            const next = parseDateKey(value);
            if (!next) return;
            const normalizedPickup = normalizePickupDate(next, today);
            const normalizedReturn = normalizeReturnDate(returnDate, normalizedPickup);
            onChange({
              pickupDate: toDateKey(normalizedPickup),
              returnDate: toDateKey(normalizedReturn),
              carId: null,
              fleetKey: null,
            });
          }}
        />
        <DateField
          label={copy.returnDate}
          value={draft.returnDate}
          min={toDateKey(addDays(pickupDate, 1))}
          onChange={(value) => {
            const next = parseDateKey(value);
            if (!next) return;
            onChange({
              returnDate: toDateKey(normalizeReturnDate(next, pickupDate)),
              carId: null,
              fleetKey: null,
            });
          }}
        />
        <TimeField
          label={copy.pickupTime}
          value={draft.pickupTime}
          onChange={(value) => onChange({ pickupTime: value })}
        />
        <TimeField
          label={copy.returnTime}
          value={draft.returnTime}
          onChange={(value) => onChange({ returnTime: value })}
        />
      </div>

      {collectionAddress.trim() ? (
        <p className="mt-4 text-xs text-muted-foreground">
          {interpolate(copy.collectionPreview, { address: collectionAddress.trim() })}
        </p>
      ) : null}
    </div>
  );
}

function DateField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: string;
  min: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className="flex h-12 items-center gap-3 rounded-xl border border-border bg-background-secondary px-4 focus-within:border-primary">
        <Calendar className="size-4 text-primary" />
        <input
          type="date"
          value={value}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm outline-none"
        />
      </span>
    </label>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className="flex h-12 items-center gap-3 rounded-xl border border-border bg-background-secondary px-4 focus-within:border-primary">
        <Calendar className="size-4 text-primary" />
        <input
          type="time"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm outline-none"
        />
      </span>
    </label>
  );
}
