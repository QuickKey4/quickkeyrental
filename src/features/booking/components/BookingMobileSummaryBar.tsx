"use client";

import { useEffect, useState } from "react";
import { ChevronUp, Shield, X } from "lucide-react";

import { formatPrice } from "@/lib/brand";
import { cn } from "@/lib/utils";

import type { BookingDraft, BookingStep } from "../bookingTypes";
import { calculateBookingTotal } from "../bookingUtils";
import { useBookingCopy } from "../useBookingCopy";
import { BookingOrderSummary } from "./BookingOrderSummary";

const COMPACT_SUMMARY_STEPS: BookingStep[] = [
  "dates",
  "cars",
  "customer",
  "driver",
  "extras",
];

type BookingMobileSummaryBarProps = {
  draft: BookingDraft;
  dailyPrice: number;
  step: BookingStep;
};

export function BookingMobileSummaryBar({
  draft,
  dailyPrice,
  step,
}: BookingMobileSummaryBarProps) {
  const book = useBookingCopy();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [step]);

  if (!COMPACT_SUMMARY_STEPS.includes(step)) return null;

  const totals = calculateBookingTotal(
    dailyPrice,
    draft.selectedExtras,
    draft.pickupDate,
    draft.returnDate,
    draft.insuranceOption,
    draft.fleetKey,
  );

  const hasCar = Boolean(draft.fleetKey);
  const summaryLine = hasCar
    ? `${totals.days} ${book.summaryDetails.days} · ${formatPrice(totals.total)}`
    : `${totals.days} ${book.summaryDetails.days}`;

  return (
    <>
      {expanded ? (
        <button
          type="button"
          aria-label={book.mobileSummary.close}
          className="fixed inset-0 z-[55] bg-black/45 lg:hidden"
          onClick={() => setExpanded(false)}
        />
      ) : null}

      <div
        className={cn(
          "fixed inset-x-0 z-[60] lg:hidden",
          "bottom-[calc(2.85rem+env(safe-area-inset-bottom,0px))]",
        )}
      >
        {expanded ? (
          <div className="max-h-[min(72vh,32rem)] overflow-y-auto rounded-t-3xl border border-border bg-surface px-5 pb-5 pt-4 shadow-[var(--shadow-lg)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {book.summary}
              </p>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="grid size-8 place-items-center rounded-full border border-border bg-background-secondary text-muted-foreground"
                aria-label={book.mobileSummary.close}
              >
                <X className="size-4" />
              </button>
            </div>

            <BookingOrderSummary draft={draft} dailyPrice={dailyPrice} variant="sidebar" />

            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="size-3.5 text-success" /> {book.cancellation}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className={cn(
            "flex w-full items-center justify-between gap-3 border-t border-border bg-surface/95 px-5 py-3.5 backdrop-blur-md",
            expanded ? "rounded-none" : "shadow-[0_-8px_24px_rgb(0_0_0_0.08)]",
          )}
        >
          <span className="min-w-0 text-left">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {book.summary}
            </span>
            <span className="mt-0.5 block truncate font-display text-base font-bold text-foreground">
              {summaryLine}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary">
            {expanded ? book.mobileSummary.hide : book.mobileSummary.show}
            <ChevronUp
              className={cn("size-4 transition-transform", expanded ? "rotate-180" : "")}
            />
          </span>
        </button>
      </div>
    </>
  );
}

export function mobileSummaryPaddingClass(step: BookingStep): string {
  return COMPACT_SUMMARY_STEPS.includes(step)
    ? "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0"
    : "";
}
