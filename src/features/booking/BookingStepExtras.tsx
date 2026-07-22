import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Shield, UserPlus } from "lucide-react";

import { formatPrice } from "@/lib/brand";
import { cn } from "@/lib/utils";

import { interpolate } from "@/i18n/interpolate";

import { getBookingExtras } from "./api/availability.functions";
import type { BookingDraft, InsuranceOption, SelectedExtra } from "./bookingTypes";
import { ADDITIONAL_DRIVER_EXTRA_ID, SECURITY_DEPOSIT_AMOUNT } from "./bookingTypes";
import { calculateExtrasTotal, dailyInsuranceRate, rentalDays } from "./bookingUtils";
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
      additionalDriverFirstName: enabled ? draft.additionalDriverFirstName : "",
      additionalDriverLastName: enabled ? draft.additionalDriverLastName : "",
      additionalDriverDateOfBirth: enabled ? draft.additionalDriverDateOfBirth : "",
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
    draft.fleetKey === "yaris-1" ? book.insurance.dailyBodyYaris : book.insurance.dailyBodyAgya;
  const depositBody = interpolate(book.insurance.depositBody, {
    amount: formatPrice(SECURITY_DEPOSIT_AMOUNT),
  });
  const dailyTotal = dailyRate * days;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 font-display text-2xl font-bold">
          {book.insurance.title}{" "}
          <span className="text-destructive" aria-label="required">
            *
          </span>
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">{book.insurance.subtitle}</p>

        <div className="grid gap-3 md:grid-cols-2" data-booking-field="insuranceOption">
          <InsuranceChoice
            selected={draft.insuranceOption === "deposit"}
            title={book.insurance.depositTitle}
            body={depositBody}
            price={interpolate(book.insurance.depositAmount, {
              amount: formatPrice(SECURITY_DEPOSIT_AMOUNT),
            })}
            secondaryPrice={book.insurance.depositAtDelivery}
            benefits={[
              book.insurance.depositBenefitNoDaily,
              book.insurance.depositBenefitNotOnline,
              book.insurance.depositBenefitRefundable,
            ]}
            selectedLabel={book.cars.selected}
            onSelect={() => setInsurance("deposit")}
          />
          <InsuranceChoice
            selected={draft.insuranceOption === "daily"}
            title={book.insurance.dailyTitle}
            body={dailyInsuranceBody}
            price={`${formatPrice(dailyRate)}${book.perDay}`}
            secondaryPrice={interpolate(book.insurance.dailyTotal, {
              total: formatPrice(dailyTotal),
              days: String(days),
            })}
            benefits={[book.insurance.dailyBenefitOnline, book.insurance.dailyBenefitAutoTotal]}
            selectedLabel={book.cars.selected}
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
            "flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0",
            draft.additionalDriverEnabled
              ? "border-primary bg-primary/8 shadow-[0_14px_32px_rgba(0,0,0,0.08)] ring-2 ring-primary/10"
              : "border-border hover:border-primary/35 hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]",
          )}
        >
          <span className="inline-grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <UserPlus className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-semibold">
              {book.extras.enableAdditionalDriver}
              {draft.additionalDriverEnabled ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                  <CheckCircle2 className="size-3" />
                  {book.cars.selected}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {additionalDriverExtra?.description ?? book.extras.additionalDriverBody}
            </p>
            <p className="mt-2 text-sm font-bold text-primary">{book.extras.free}</p>
          </div>
        </button>

        {draft.additionalDriverEnabled ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label={book.extras.additionalDriverFirstName}
              value={draft.additionalDriverFirstName}
              onChange={(value) => {
                const additionalDriverFirstName = sanitizePersonNameInput(value);
                onChange({
                  additionalDriverFirstName,
                  additionalDriverName:
                    `${additionalDriverFirstName} ${draft.additionalDriverLastName}`.trim(),
                });
              }}
              error={errors.additionalDriverFirstName}
              fieldName="additionalDriverFirstName"
              required
            />
            <Field
              label={book.extras.additionalDriverLastName}
              value={draft.additionalDriverLastName}
              onChange={(value) => {
                const additionalDriverLastName = sanitizePersonNameInput(value);
                onChange({
                  additionalDriverLastName,
                  additionalDriverName:
                    `${draft.additionalDriverFirstName} ${additionalDriverLastName}`.trim(),
                });
              }}
              error={errors.additionalDriverLastName}
              fieldName="additionalDriverLastName"
              required
            />
            <Field
              label={book.extras.additionalDriverDateOfBirth}
              type="date"
              value={draft.additionalDriverDateOfBirth}
              onChange={(value) => onChange({ additionalDriverDateOfBirth: value })}
              error={errors.additionalDriverDateOfBirth}
              fieldName="additionalDriverDateOfBirth"
              required
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
              fieldName="additionalDriverLicense"
              required
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
                  "flex w-full items-start justify-between gap-4 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0",
                  selected
                    ? "border-primary bg-primary/8 shadow-[0_14px_32px_rgba(0,0,0,0.08)] ring-2 ring-primary/10"
                    : "border-border hover:border-primary/35 hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]",
                )}
              >
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    {extra.name}
                    {selected ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                        <CheckCircle2 className="size-3" />
                        {book.cars.selected}
                      </span>
                    ) : null}
                  </p>
                  {extra.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{extra.description}</p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
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
  secondaryPrice,
  benefits,
  selectedLabel,
  onSelect,
}: {
  selected: boolean;
  title: string;
  body: string;
  price: string;
  secondaryPrice: string;
  benefits: string[];
  selectedLabel: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex h-full flex-col rounded-2xl border p-4 text-left transition-all duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0",
        selected
          ? "border-primary bg-primary/8 shadow-[0_14px_32px_rgba(0,0,0,0.08)] ring-2 ring-primary/15"
          : "border-border bg-background hover:border-primary/35 hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-grid size-10 place-items-center rounded-xl",
            selected ? "bg-primary text-white" : "bg-primary/10 text-primary",
          )}
        >
          <Shield className="size-5" />
        </span>
        {selected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
            <CheckCircle2 className="size-3" />
            {selectedLabel}
          </span>
        ) : null}
      </div>
      <div className="space-y-2">
        <p className="font-display text-xl font-bold text-foreground">{title}</p>
        <div>
          <p className="text-2xl font-black text-primary">{price}</p>
          <p className="text-sm font-semibold text-foreground">{secondaryPrice}</p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        {benefits.map((benefit) => (
          <p key={benefit} className="flex items-start gap-2 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{benefit}</span>
          </p>
        ))}
      </div>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  fieldName,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  fieldName?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5" data-booking-field={fieldName}>
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}{" "}
        {required ? (
          <span className="text-destructive" aria-label="required">
            *
          </span>
        ) : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-12 rounded-xl border bg-background-secondary px-4 text-base outline-none focus:border-primary sm:text-sm",
          error ? "border-destructive/60" : "border-border",
        )}
      />
      {error ? (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
