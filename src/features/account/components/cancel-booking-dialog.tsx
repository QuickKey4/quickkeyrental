import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n/provider";
import { formatPrice } from "@/lib/brand";
import {
  getCancellationFeeAmount,
  isFreeCancellation,
  requiresCancellationFee,
} from "@/lib/booking-policy";

import type { BookingWithCar } from "../account-queries";

type CancelBookingDialogProps = {
  booking: BookingWithCar | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (acceptCancellationFee: boolean) => Promise<void>;
  loading?: boolean;
  error?: string;
};

export function CancelBookingDialog({
  booking,
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  error,
}: CancelBookingDialogProps) {
  const { messages, intlLocale } = useI18n();
  const copy = messages.account.bookings.cancellationDialog;

  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!open) setAgreed(false);
  }, [open, booking?.id]);

  if (!booking) return null;

  const free = isFreeCancellation(booking);
  const feeRequired = requiresCancellationFee(booking);
  const fee = getCancellationFeeAmount(booking);
  const feeLabel = formatPrice(fee, intlLocale);

  const handleConfirm = () => {
    void onConfirm(feeRequired);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{copy.title}</DialogTitle>
          <DialogDescription className="text-left text-sm leading-relaxed">
            {free
              ? copy.freeBody
              : copy.feeBody.replace("{fee}", feeLabel)}
          </DialogDescription>
        </DialogHeader>

        {feeRequired ? (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="text-sm font-semibold text-amber-950">
              {copy.feeAmount.replace("{fee}", feeLabel)}
            </p>
            <p className="text-xs leading-relaxed text-amber-900/80">{copy.feeNotice}</p>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                className="mt-0.5 size-4 rounded border-border accent-[var(--logo-red)]"
              />
              <span>{copy.agreeLabel.replace("{fee}", feeLabel)}</span>
            </label>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-[4px] border border-border text-xs font-bold uppercase tracking-[0.1em] disabled:opacity-60"
          >
            {copy.keepBooking}
          </button>
          <button
            type="button"
            disabled={loading || (feeRequired && !agreed)}
            onClick={handleConfirm}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[4px] bg-[var(--logo-red)] text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-[#c92228] disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {free ? copy.confirmFree : copy.confirmWithFee}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
