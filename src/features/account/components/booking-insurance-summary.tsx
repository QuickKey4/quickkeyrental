import { AlertCircle, CreditCard, MapPin, Shield } from "lucide-react";

import { useI18n } from "@/i18n/provider";
import { interpolate } from "@/i18n/interpolate";
import { SECURITY_DEPOSIT_AMOUNT } from "@/features/booking/bookingTypes";
import { rentalDays } from "@/features/booking/bookingUtils";
import { formatPrice } from "@/lib/brand";
import { cn } from "@/lib/utils";

import type { BookingWithCar } from "../account-queries";

type BookingInsuranceSummaryProps = {
  booking: BookingWithCar;
  /** Shorter layout for dashboard cards */
  compact?: boolean;
};

export function BookingInsuranceSummary({ booking, compact = false }: BookingInsuranceSummaryProps) {
  const { messages, intlLocale } = useI18n();
  const copy = messages.account.manageBooking.insuranceDetail;

  if (booking.insurance_option !== "deposit" && booking.insurance_option !== "daily") {
    return null;
  }

  const depositAmount = Number(booking.deposit_amount ?? SECURITY_DEPOSIT_AMOUNT);
  const days = rentalDays(booking.pickup_date, booking.return_date);

  const isDeposit = booking.insurance_option === "deposit";
  const optionCopy = isDeposit ? copy.deposit : copy.daily;

  const depositAmountFormatted = formatPrice(depositAmount, intlLocale);

  const amountLabel = isDeposit
    ? interpolate(copy.deposit.amount, {
        amount: depositAmountFormatted,
      })
    : interpolate(copy.daily.amount, {
        total: formatPrice(Number(booking.insurance_total ?? 0), intlLocale),
        rate: formatPrice(Number(booking.insurance_daily_rate ?? 0), intlLocale),
        days: String(days),
      });

  const body = isDeposit
    ? interpolate(copy.deposit.body, {
        amount: depositAmountFormatted,
      })
    : copy.daily.body;

  const reminder = isDeposit
    ? interpolate(copy.deposit.reminder, {
        amount: depositAmountFormatted,
      })
    : null;

  const paymentBadge = isDeposit ? copy.deposit.payAtDelivery : copy.daily.paidOnline;

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--logo-red)]/15 bg-gradient-to-br from-[#fff8f8] to-white",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="inline-grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--logo-red)]/10 text-[var(--logo-red)]">
          <Shield className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {copy.label}
          </p>
          <p className="mt-1 font-display text-base font-bold text-[var(--logo-black)] sm:text-lg">
            {optionCopy.title}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--logo-red)]">{amountLabel}</p>
          <span
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
              isDeposit
                ? "bg-amber-100 text-amber-900"
                : "bg-emerald-100 text-emerald-800",
            )}
          >
            {isDeposit ? <MapPin className="size-3.5" /> : <CreditCard className="size-3.5" />}
            {paymentBadge}
          </span>
        </div>
      </div>

      <p className={cn("text-sm leading-relaxed text-muted-foreground", compact ? "mt-3" : "mt-4")}>
        {body}
      </p>

      {!compact ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.intro}</p> : null}

      {isDeposit ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-white/80 px-3 py-2.5 text-xs leading-relaxed text-[var(--logo-black)]">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          {reminder}
        </p>
      ) : null}
    </div>
  );
}
