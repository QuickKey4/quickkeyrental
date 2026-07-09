import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { SecurePaymentStrip } from "@/components/secure-payment-strip";
import { Button } from "@/components/ui/button";
import { translateBookError } from "@/i18n/translate-server-error";

import { createSentooCheckout } from "./api/booking.functions";
import { useBookingCopy } from "./useBookingCopy";

type BookingStepPaymentProps = {
  bookingId: string;
};

export function BookingStepPayment({ bookingId }: BookingStepPaymentProps) {
  const book = useBookingCopy();
  const copy = book.payment;
  const [sentooError, setSentooError] = useState("");
  const [sentooLoading, setSentooLoading] = useState(false);

  const startSentooCheckout = async () => {
    setSentooLoading(true);
    setSentooError("");
    try {
      const result = await createSentooCheckout({ data: { bookingId } });
      window.location.href = result.url;
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error ? checkoutError.message : book.errors.generic;
      setSentooError(translateBookError(message, book.errors));
      setSentooLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <h2 className="mb-1 text-center font-display text-2xl font-bold sm:text-left">{copy.title}</h2>
      <p className="mb-5 text-center text-sm leading-relaxed text-muted-foreground sm:text-left">
        {copy.subtitle}
      </p>

      <SecurePaymentStrip
        variant="card"
        title={copy.acceptedMethods}
        localBanksLabel={copy.localBanksShort}
        className="mb-5"
      />

      <div className="overflow-hidden rounded-2xl border-2 border-[var(--logo-red)]/25 bg-gradient-to-b from-[var(--logo-red)]/[0.04] to-white shadow-[0_8px_32px_rgba(232,40,46,0.08)]">
        <div className="border-b border-[var(--logo-red)]/10 bg-[var(--logo-red)]/[0.06] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[var(--logo-red)] shadow-sm sm:size-12">
                <CreditCard className="size-5 sm:size-6" strokeWidth={2} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--logo-red)]">
                  {copy.sentooBadge}
                </p>
                <h3 className="font-display text-base font-bold text-[var(--logo-black)] sm:text-lg">
                  {copy.sentooTitle}
                </h3>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 self-center rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--logo-black)] sm:self-auto">
              <Lock className="size-3.5 text-[var(--logo-red)]" />
              {copy.secureCheckout}
            </span>
          </div>
        </div>

        <div className="space-y-4 px-4 py-5 sm:space-y-5 sm:px-6 sm:py-6">
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.sentooBody}</p>

          <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            <li className="flex gap-2">
              <span className="font-semibold text-[var(--logo-black)]">{copy.sentooBankTitle}:</span>
              <span>{copy.sentooBankHint}</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-[var(--logo-black)]">{copy.sentooCardTitle}:</span>
              <span>{copy.sentooCardHint}</span>
            </li>
          </ul>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--logo-red)]" />
            {copy.sentooSecureNote}
          </p>

          {sentooError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {sentooError}
            </div>
          ) : null}

          <Button
            type="button"
            size="lg"
            className="h-12 w-full text-base font-semibold sm:h-14"
            onClick={() => void startSentooCheckout()}
            disabled={sentooLoading}
          >
            {sentooLoading ? copy.redirecting : copy.sentooCta}
          </Button>

          <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
            {copy.poweredBySentoo}
          </p>
        </div>
      </div>
    </div>
  );
}
