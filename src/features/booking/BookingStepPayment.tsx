import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { translateBookError } from "@/i18n/translate-server-error";

import {
  cancelSentooCheckout,
  createSentooCheckout,
  syncSentooPaymentStatus,
} from "./api/booking.functions";
import { useBookingCopy } from "./useBookingCopy";

type BookingStepPaymentProps = {
  bookingId: string;
  checkoutSessionId: string;
  bookingTestCode?: string;
  initialAttempt?: string;
  onPaid?: () => void;
  onExpired?: () => void;
  onReturnToBooking?: () => void;
};

const sentooAttemptKey = (bookingId: string) => `quickkey.sentooAttempt.${bookingId}`;

export function BookingStepPayment({
  bookingId,
  checkoutSessionId,
  bookingTestCode,
  initialAttempt,
  onPaid,
  onExpired,
  onReturnToBooking,
}: BookingStepPaymentProps) {
  const book = useBookingCopy();
  const copy = book.payment;
  const [sentooError, setSentooError] = useState("");
  const [sentooLoading, setSentooLoading] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<
    "idle" | "syncing" | "active" | "failed" | "expired"
  >("idle");
  const [shouldSyncRecovery, setShouldSyncRecovery] = useState(() => {
    if (initialAttempt) return true;
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(sentooAttemptKey(bookingId)) === "started";
  });
  const syncInFlightRef = useRef(false);
  const checkoutInFlightRef = useRef(false);
  const onPaidRef = useRef(onPaid);
  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onPaidRef.current = onPaid;
    onExpiredRef.current = onExpired;
  }, [onExpired, onPaid]);

  const syncPayment = useCallback(async () => {
    if (syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    setRecoveryStatus("syncing");
    setSentooError("");
    try {
      const result = await syncSentooPaymentStatus({
        data: { bookingId, checkoutSessionId, bookingTestCode },
      });
      if (result.paid) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(sentooAttemptKey(bookingId));
        }
        onPaidRef.current?.();
        return;
      }
      if (result.expired) {
        setRecoveryStatus("expired");
        onExpiredRef.current?.();
        return;
      }
      if (result.status === "none") {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(sentooAttemptKey(bookingId));
        }
        setShouldSyncRecovery(false);
      }
      setRecoveryStatus(result.reusable ? "active" : result.final ? "failed" : "idle");
    } catch {
      setRecoveryStatus("idle");
    } finally {
      syncInFlightRef.current = false;
    }
  }, [bookingId, bookingTestCode, checkoutSessionId]);

  useEffect(() => {
    if (!shouldSyncRecovery) return;
    void syncPayment();
  }, [shouldSyncRecovery, syncPayment]);

  const startSentooCheckout = async () => {
    if (checkoutInFlightRef.current) return;
    checkoutInFlightRef.current = true;
    setSentooLoading(true);
    setSentooError("");
    try {
      const result = await createSentooCheckout({
        data: { bookingId, checkoutSessionId, bookingTestCode },
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(sentooAttemptKey(bookingId), "started");
      }
      window.location.href = result.url;
    } catch (checkoutError) {
      const message = checkoutError instanceof Error ? checkoutError.message : book.errors.generic;
      const translated = translateBookError(message, book.errors);
      setSentooError(
        bookingTestCode && translated === book.errors.sentooNoUrl
          ? message
          : translated === book.errors.generic
            ? book.errors.sentooNoUrl
            : translated,
      );
      setSentooLoading(false);
      checkoutInFlightRef.current = false;
    }
  };

  const cancelCheckout = async () => {
    setSentooLoading(true);
    setSentooError("");
    try {
      await cancelSentooCheckout({ data: { bookingId, checkoutSessionId, bookingTestCode } });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(sentooAttemptKey(bookingId));
      }
      setShouldSyncRecovery(false);
      setRecoveryStatus("idle");
      onReturnToBooking?.();
    } catch (checkoutError) {
      const message = checkoutError instanceof Error ? checkoutError.message : book.errors.generic;
      setSentooError(translateBookError(message, book.errors));
    } finally {
      setSentooLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <h2 className="mb-1 text-center font-display text-2xl font-bold sm:text-left">
        {copy.title}
      </h2>
      <p className="mb-5 text-center text-sm leading-relaxed text-muted-foreground sm:text-left">
        {copy.subtitle}
      </p>

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

          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--logo-red)]" />
            {copy.sentooSecureNote}
          </p>

          {sentooError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {sentooError}
            </div>
          ) : null}

          {recoveryStatus === "syncing" ? (
            <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm text-muted-foreground">
              {copy.syncing}
            </div>
          ) : null}

          {recoveryStatus === "active" ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {copy.recoveryActive}
            </div>
          ) : null}

          {recoveryStatus === "failed" ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {copy.recoveryFailed}
            </div>
          ) : null}

          {recoveryStatus === "expired" ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {book.hold.expired}
            </div>
          ) : null}

          <Button
            type="button"
            size="lg"
            className="h-auto min-h-14 w-full rounded-xl bg-[#026990] px-3 py-2 text-base font-semibold hover:bg-[#015a7d]"
            onClick={() => void startSentooCheckout()}
            disabled={sentooLoading}
            aria-label={
              sentooLoading
                ? copy.redirecting
                : recoveryStatus === "active"
                  ? copy.resumePayment
                  : recoveryStatus === "failed"
                    ? copy.retry
                    : copy.sentooCta
            }
          >
            {sentooLoading ? (
              copy.redirecting
            ) : recoveryStatus === "active" ? (
              copy.resumePayment
            ) : recoveryStatus === "failed" ? (
              copy.retry
            ) : (
              <img
                src="/sentoo-payment-button-curacao-bes.svg"
                alt={copy.sentooCta}
                className="h-auto max-h-12 w-full max-w-md"
              />
            )}
          </Button>

          {recoveryStatus === "active" || recoveryStatus === "failed" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={onReturnToBooking}
                disabled={sentooLoading}
              >
                {copy.returnToBooking}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void cancelCheckout()}
                disabled={sentooLoading}
              >
                {copy.cancelCheckout}
              </Button>
            </div>
          ) : null}

          <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
            {copy.poweredBySentoo}
          </p>
        </div>
      </div>
    </div>
  );
}
