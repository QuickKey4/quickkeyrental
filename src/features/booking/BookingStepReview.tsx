import { Shield } from "lucide-react";

import { useBookingCopy } from "./useBookingCopy";
import type { BookingDraft } from "./bookingTypes";
import { BookingOrderSummary } from "./components/BookingOrderSummary";

type BookingStepReviewProps = {
  draft: BookingDraft;
  dailyPrice: number;
};

export function BookingStepReview({ draft, dailyPrice }: BookingStepReviewProps) {
  const book = useBookingCopy();
  const copy = book.review;

  return (
    <div>
      <h2 className="mb-1 font-display text-2xl font-bold">{copy.title}</h2>
      <p className="mb-6 text-sm text-muted-foreground">{copy.subtitle}</p>

      <div className="rounded-2xl border border-border bg-background-secondary/50 p-5">
        <BookingOrderSummary draft={draft} dailyPrice={dailyPrice} variant="review" />

        <p className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <Shield className="size-3.5 text-success" /> {book.cancellation}
        </p>
      </div>
    </div>
  );
}
