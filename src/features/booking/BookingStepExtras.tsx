import { useQuery } from "@tanstack/react-query";
import { Shield, UserPlus } from "lucide-react";

import { formatPrice } from "@/lib/brand";
import { cn } from "@/lib/utils";

import { interpolate } from "@/i18n/interpolate";

import { getBookingExtras } from "./api/availability.functions";
import type { BookingDraft, InsuranceOption, SelectedExtra } from "./bookingTypes";
import { ADDITIONAL_DRIVER_EXTRA_ID, SECURITY_DEPOSIT_AMOUNT } from "./bookingTypes";
import {
  calculateExtrasTotal,
  dailyInsuranceRate,
  rentalDays,
} from "./bookingUtils";
import { sanitizePersonNameInput } from "./bookingValidation";
import { useBookingCopy } from "./useBookingCopy";

type BookingStepExtrasProps = {
  draft: BookingDraft;
  onChange: (patch: Partial<BookingDraft>) => void;
  errors: Record<string, string>;
};

export function BookingStepExtras({ draft, onChange, errors }: BookingStepExtrasProps) {
  const book = useBookingCopy();
  const { data: extras = [], isLoading } = useQuery({
    queryKey: ["booking-extras"],
    queryFn: () => getBookingExtras(),
  });

  const days = rentalDays(draft.pickupDate, draft.returnDate);
  const dailyRate = dailyInsuranceRate(draft.fleetKey);
  const selectedMap = new Map(draft.selectedExtras.map((extra) => [extra.id, extra]));
  const paidExtras = extras.filter(
    (extra) => Number(extra.price_per_day) > 0 && extra.id !== ADDITIONAL_DRIVER_EXTRA_ID,
  );
  const additionalDriverExtra = extras.find((extra) => extra.id === ADDITIONAL_DRIVER_EXTRA_ID);

  const setInsurance = (option: InsuranceOption) => onChange({ insuranceOption: option });

  const toggleExtra = (extra: (typeof extras)[number]) => {
    const existing = selectedMap.get(extra.id);
    const next: SelectedExtra[] = existing
      ? draft.selectedExtras.filter((item) => item.id !== extra.id)
      : [
          ...draft.selectedExtras,
          {
            id: extra.id,
            name: extra.name,
            pricePerDay: Number(extra.price_per_day),
            quantity: 1,
          },
        ];
    onChange({ selectedExtras: next });
  };

  const setAdditionalDriverEnabled = (enabled: boolean) => {
    const withoutDriverExtra = draft.selectedExtras.filter(
      (item) => item.id !== ADDITIONAL_DRIVER_EXTRA_ID,
    );
    onChange({
      additionalDriverEnabled: enabled,
      additionalDriverName: enabled ? draft.additionalDriverName : "",
      additionalDriverLicense: enabled ? draft.additionalDriverLicense : "",
      selectedExtras:
        enabled && additionalDriverExtra
          ? [
              ...withoutDriverExtra,
              {
                id: additionalDriverExtra.id,
                name: additionalDriverExtra.name,
                pricePerDay: 0,
                quantity: 1,
              },
            ]
          : withoutDriverExtra,
    });
  };

  const dailyInsuranceBody =
    draft.fleetKey === "yaris-1"
      ? book.insurance.dailyBodyYaris
      : book.insurance.dailyBodyAgya;
  const depositBody = interpolate(book.insurance.depositBody, {
    amount: formatPrice(SECURITY_DEPOSIT_AMOUNT),
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 font-display text-2xl font-bold">{book.insurance.title}</h2>
        <p className="mb-6 text-sm text-muted-foreground">{book.insurance.subtitle}</p>

        <div className="grid gap-3 md:grid-cols-2">
          <InsuranceChoice
            selected={draft.insuranceOption === "deposit"}
            title={`${book.insurance.depositTitle} — ${formatPrice(SECURITY_DEPOSIT_AMOUNT)}`}
            body={depositBody}
            price={book.insurance.depositAtDelivery}
            onSelect={() => setInsurance("deposit")}
          />
          <InsuranceChoice
            selected={draft.insuranceOption === "daily"}
            title={book.insurance.dailyTitle}
            body={dailyInsuranceBody}
            price={`${formatPrice(dailyRate)}${book.perDay} × ${days} = ${formatPrice(dailyRate * days)}`}
            onSelect={() => setInsurance("daily")}
          />
        </div>
        {errors.insuranceOption ? (
          <p className="mt-3 text-sm text-destructive">{errors.insuranceOption}</p>
        ) : null}
      </div>

      <div>
        <h3 className="mb-1 font-display text-xl font-bold">{book.extras.additionalDriverTitle}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{book.extras.additionalDriverBody}</p>

        <button
          type="button"
          onClick={() => setAdditionalDriverEnabled(!draft.additionalDriverEnabled)}
          className={cn(
            "flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors",
            draft.additionalDriverEnabled
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/35",
          )}
        >
          <span className="inline-grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <UserPlus className="size-5" />
          </span>
          <div>
            <p className="font-semibold">{book.extras.enableAdditionalDriver}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {additionalDriverExtra?.description ?? book.extras.additionalDriverBody}
            </p>
            <p className="mt-2 text-sm font-bold text-primary">{book.extras.free}</p>
          </div>
        </button>

        {draft.additionalDriverEnabled ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label={book.extras.additionalDriverName}
              value={draft.additionalDriverName}
              onChange={(value) =>
                onChange({ additionalDriverName: sanitizePersonNameInput(value) })
              }
              error={errors.additionalDriverName}
            />
            <Field
              label={book.extras.additionalDriverLicense}
              value={draft.additionalDriverLicense}
              onChange={(value) =>
                onChange({
                  additionalDriverLicense: value.replace(/[^A-Za-z0-9-]/g, ""),
                })
              }
              error={errors.additionalDriverLicense}
            />
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="mb-1 font-display text-xl font-bold">{book.extras.title}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{book.extras.subtitle}</p>

        {isLoading ? <p className="text-sm text-muted-foreground">{book.extras.loading}</p> : null}

        <div className="space-y-3">
          {paidExtras.map((extra) => {
            const selected = selectedMap.has(extra.id);
            return (
              <button
                key={extra.id}
                type="button"
                onClick={() => toggleExtra(extra)}
                className={cn(
                  "flex w-full items-start justify-between gap-4 rounded-2xl border p-4 text-left transition-colors",
                  selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/35",
                )}
              >
                <div>
                  <p className="font-semibold">{extra.name}</p>
                  {extra.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{extra.description}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-sm font-bold text-primary">
                  {formatPrice(Number(extra.price_per_day))}
                  {book.perDay}
                </span>
              </button>
            );
          })}
          {!isLoading && paidExtras.length === 0 ? (
            <p className="text-sm text-muted-foreground">{book.extras.noneSelected}</p>
          ) : null}
        </div>

        {draft.selectedExtras.filter((extra) => extra.pricePerDay > 0).length > 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {interpolate(book.extras.extrasTotal, {
              total: formatPrice(
                calculateExtrasTotal(draft.selectedExtras, draft.pickupDate, draft.returnDate),
              ),
            })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function InsuranceChoice({
  selected,
  title,
  body,
  price,
  onSelect,
}: {
  selected: boolean;
  title: string;
  body: string;
  price: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-2xl border p-4 text-left transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/35",
      )}
    >
      <div className="mb-3 inline-grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Shield className="size-5" />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <p className="mt-3 text-sm font-semibold text-primary">{price}</p>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-xl border border-border bg-background-secondary px-4 text-sm outline-none focus:border-primary"
      />
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
    </label>
  );
}
