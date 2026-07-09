import { Shield } from "lucide-react";

import { cn } from "@/lib/utils";

import type { BookingDraft } from "../bookingTypes";
import { useBookingCopy } from "../useBookingCopy";
import { BookingOrderSummary } from "./BookingOrderSummary";

type BookingSummaryProps = {
  draft: BookingDraft;
  dailyPrice: number;
  className?: string;
};

export function BookingSummary({ draft, dailyPrice, className }: BookingSummaryProps) {
  const book = useBookingCopy();

  return (
    <aside
      className={cn(
        "h-fit rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-md)] lg:sticky lg:top-28",
        className,
      )}
    >
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {book.summary}
      </p>

      <BookingOrderSummary draft={draft} dailyPrice={dailyPrice} variant="sidebar" />

      <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="size-3.5 text-success" /> {book.cancellation}
      </p>
    </aside>
  );
}
