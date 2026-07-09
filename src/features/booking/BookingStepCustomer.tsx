import { Mail, User } from "lucide-react";

import { BRAND } from "@/lib/brand";

import { useBookingCopy } from "./useBookingCopy";
import type { BookingDraft } from "./bookingTypes";
import { sanitizePersonNameInput, sanitizePhoneInput } from "./bookingValidation";

type BookingStepCustomerProps = {
  draft: BookingDraft;
  onChange: (patch: Partial<BookingDraft>) => void;
  errors: Record<string, string>;
};

export function BookingStepCustomer({ draft, onChange, errors }: BookingStepCustomerProps) {
  const copy = useBookingCopy().customer;

  return (
    <div>
      <h2 className="mb-1 font-display text-2xl font-bold">{copy.title}</h2>
      <p className="mb-6 text-sm text-muted-foreground">{copy.subtitle}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          icon={<User className="size-4" />}
          label={copy.fullName}
          value={draft.guestName}
          onChange={(event) =>
            onChange({ guestName: sanitizePersonNameInput(event.target.value) })
          }
          autoComplete="name"
          error={errors.guestName}
          hint={copy.fullNameHint}
        />
        <Input
          icon={<Mail className="size-4" />}
          label={copy.email}
          type="email"
          value={draft.guestEmail}
          onChange={(event) => onChange({ guestEmail: event.target.value })}
          autoComplete="email"
          error={errors.guestEmail}
        />
        <Input
          icon={<User className="size-4" />}
          label={copy.phone}
          value={draft.guestPhone}
          onChange={(event) => onChange({ guestPhone: sanitizePhoneInput(event.target.value) })}
          placeholder={BRAND.phone}
          autoComplete="tel"
          inputMode="tel"
          error={errors.guestPhone}
          hint={copy.phoneHint}
        />
      </div>
    </div>
  );
}

function Input({
  icon,
  label,
  error,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode;
  label: string;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 sm:col-span-1">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className="flex h-12 items-center gap-3 rounded-xl border border-border bg-background-secondary px-4 transition-colors focus-within:border-primary">
        <span className="text-primary">{icon}</span>
        <input
          {...props}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </span>
      {hint && !error ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
    </label>
  );
}
