import { User } from "lucide-react";

import { useBookingCopy } from "./useBookingCopy";
import type { BookingDraft } from "./bookingTypes";

type BookingStepDriverProps = {
  draft: BookingDraft;
  onChange: (patch: Partial<BookingDraft>) => void;
  errors: Record<string, string>;
};

export function BookingStepDriver({ draft, onChange, errors }: BookingStepDriverProps) {
  const copy = useBookingCopy().driver;

  return (
    <div>
      <h2 className="mb-1 font-display text-2xl font-bold">{copy.title}</h2>
      <p className="mb-6 text-sm text-muted-foreground">{copy.subtitle}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          icon={<User className="size-4" />}
          label={copy.license}
          value={draft.driverLicense}
          onChange={(event) =>
            onChange({ driverLicense: event.target.value.replace(/[^A-Za-z0-9-]/g, "") })
          }
          error={errors.driverLicense}
          placeholder={copy.licensePlaceholder}
        />
        <Input
          icon={<User className="size-4" />}
          label={copy.flightNumber}
          value={draft.flightNumber}
          onChange={(event) => onChange({ flightNumber: event.target.value })}
        />
      </div>

      <label className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-background-secondary/60 p-4">
        <input
          type="checkbox"
          checked={draft.driverAgeConfirmed}
          onChange={(event) => onChange({ driverAgeConfirmed: event.target.checked })}
          className="mt-1 size-4 rounded border-border"
        />
        <span className="text-sm leading-relaxed">{copy.ageConfirm}</span>
      </label>
      {errors.driverAgeConfirmed ? (
        <p className="mt-2 text-sm text-destructive">{errors.driverAgeConfirmed}</p>
      ) : null}
    </div>
  );
}

function Input({
  icon,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode;
  label: string;
  error?: string;
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
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
    </label>
  );
}
