import { CalendarDays, Check, IdCard, Mail, Plane, ShieldCheck, User } from "lucide-react";

import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

import { useBookingCopy } from "./useBookingCopy";
import type { BookingDraft } from "./bookingTypes";
import { sanitizePersonNameInput } from "./bookingValidation";
import { InternationalPhoneInput } from "./components/InternationalPhoneInput";

type BookingStepCustomerProps = {
  draft: BookingDraft;
  onChange: (patch: Partial<BookingDraft>) => void;
  errors: Record<string, string>;
};

export function BookingStepCustomer({ draft, onChange, errors }: BookingStepCustomerProps) {
  const copy = useBookingCopy().customer;
  const { locale } = useI18n();

  return (
    <div>
      <h2 className="mb-1 font-display text-2xl font-bold">{copy.title}</h2>
      <p className="mb-6 text-sm text-muted-foreground">{copy.subtitle}</p>

      <div className="space-y-5">
        <CustomerSection
          eyebrow={copy.sections.contactEyebrow}
          title={copy.sections.contactTitle}
          body={copy.sections.contactBody}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              icon={<User className="size-4" />}
              label={copy.firstName}
              required
              fieldName="guestFirstName"
              value={draft.guestFirstName}
              onChange={(event) => {
                const guestFirstName = sanitizePersonNameInput(event.target.value);
                onChange({
                  guestFirstName,
                  guestName: `${guestFirstName} ${draft.guestLastName}`.trim(),
                });
              }}
              autoComplete="given-name"
              error={errors.guestFirstName}
              hint={copy.fullNameHint}
            />
            <Input
              icon={<User className="size-4" />}
              label={copy.lastName}
              required
              fieldName="guestLastName"
              value={draft.guestLastName}
              onChange={(event) => {
                const guestLastName = sanitizePersonNameInput(event.target.value);
                onChange({
                  guestLastName,
                  guestName: `${draft.guestFirstName} ${guestLastName}`.trim(),
                });
              }}
              autoComplete="family-name"
              error={errors.guestLastName}
            />
            <Input
              icon={<Mail className="size-4" />}
              label={copy.email}
              required
              fieldName="guestEmail"
              type="email"
              value={draft.guestEmail}
              onChange={(event) => onChange({ guestEmail: event.target.value })}
              autoComplete="email"
              error={errors.guestEmail}
            />
            <InternationalPhoneInput
              label={copy.phone}
              value={draft.guestPhone}
              onChange={(guestPhone) => onChange({ guestPhone })}
              locale={locale}
              error={errors.guestPhone}
              hint={copy.phoneHint}
            />
          </div>
        </CustomerSection>

        <CustomerSection
          eyebrow={copy.sections.driverEyebrow}
          title={copy.sections.driverTitle}
          body={copy.sections.driverBody}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              icon={<CalendarDays className="size-4" />}
              label={copy.driverDateOfBirth}
              required
              fieldName="driverDateOfBirth"
              type="date"
              value={draft.driverDateOfBirth}
              onChange={(event) => onChange({ driverDateOfBirth: event.target.value })}
              error={errors.driverDateOfBirth}
            />
            <Input
              icon={<IdCard className="size-4" />}
              label={copy.driverLicense}
              required
              fieldName="driverLicense"
              value={draft.driverLicense}
              onChange={(event) =>
                onChange({ driverLicense: event.target.value.replace(/[^A-Za-z0-9-]/g, "") })
              }
              error={errors.driverLicense}
              placeholder={copy.licensePlaceholder}
            />
          </div>

          <label
            data-booking-field="driverAgeConfirmed"
            className={cn(
              "mt-4 flex items-start gap-3 rounded-2xl border p-4 transition-all duration-200",
              draft.driverAgeConfirmed
                ? "border-primary/25 bg-primary/5"
                : "border-border bg-background-secondary/60 hover:border-primary/25",
            )}
          >
            <input
              type="checkbox"
              checked={draft.driverAgeConfirmed}
              onChange={(event) => onChange({ driverAgeConfirmed: event.target.checked })}
              className="mt-1 size-4 rounded border-border"
            />
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white text-primary">
              <ShieldCheck className="size-4" />
            </span>
            <span className="text-sm leading-relaxed">
              {copy.ageConfirm}{" "}
              <span className="text-destructive" aria-label="required">
                *
              </span>
            </span>
          </label>
          {errors.driverAgeConfirmed ? (
            <p className="mt-2 text-sm text-destructive">{errors.driverAgeConfirmed}</p>
          ) : null}
        </CustomerSection>

        <CustomerSection
          eyebrow={copy.sections.arrivalEyebrow}
          title={copy.arrivingByPlane}
          body={copy.arrivalHint}
        >
          <div className="grid gap-2 sm:grid-cols-2" data-booking-field="arrivingByPlane">
            <ChoiceButton
              selected={draft.arrivingByPlane === true}
              label={copy.yes}
              onClick={() => onChange({ arrivingByPlane: true })}
            />
            <ChoiceButton
              selected={draft.arrivingByPlane === false}
              label={copy.no}
              onClick={() => onChange({ arrivingByPlane: false, flightNumber: "" })}
            />
          </div>
          {errors.arrivingByPlane ? (
            <p className="mt-2 text-sm text-destructive">{errors.arrivingByPlane}</p>
          ) : null}
          {draft.arrivingByPlane ? (
            <Input
              icon={<Plane className="size-4" />}
              label={copy.flightNumber}
              required
              fieldName="flightNumber"
              value={draft.flightNumber}
              onChange={(event) => onChange({ flightNumber: event.target.value.toUpperCase() })}
              error={errors.flightNumber}
              className="mt-4"
            />
          ) : null}
        </CustomerSection>
      </div>
    </div>
  );
}

function CustomerSection({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-border/80 bg-white p-4 shadow-[0_12px_30px_rgba(16,16,16,0.04)] md:p-5">
      <div className="mb-4">
        <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-primary/80">
          {eyebrow}
        </p>
        <h3 className="font-display text-lg font-bold text-[var(--logo-black)]">{title}</h3>
        {body ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ChoiceButton({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-12 items-center justify-between rounded-2xl border px-4 py-2 text-sm font-semibold transition-all duration-200 motion-reduce:transition-none",
        selected
          ? "border-primary/35 bg-primary/10 text-primary shadow-[0_10px_22px_rgba(232,40,46,0.08)]"
          : "border-border bg-background-secondary/60 text-muted-foreground hover:border-primary/30 hover:bg-white",
      )}
    >
      <span>{label}</span>
      {selected ? <Check className="size-4" /> : null}
    </button>
  );
}

function Input({
  icon,
  label,
  error,
  hint,
  className = "",
  required = false,
  fieldName,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  fieldName?: string;
}) {
  return (
    <label
      className={cn("flex flex-col gap-1.5 sm:col-span-1", className)}
      data-booking-field={fieldName}
    >
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}{" "}
        {required ? (
          <span className="text-destructive" aria-label="required">
            *
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "flex h-12 items-center gap-3 rounded-xl border bg-background-secondary px-4 transition-all duration-200 focus-within:border-primary focus-within:bg-white focus-within:shadow-[0_8px_20px_rgba(16,16,16,0.05)]",
          error ? "border-destructive/50" : "border-border",
        )}
      >
        <span className="text-primary">{icon}</span>
        <input
          {...props}
          aria-invalid={Boolean(error)}
          required={required}
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
        />
      </span>
      {hint && !error ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      {error ? (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
