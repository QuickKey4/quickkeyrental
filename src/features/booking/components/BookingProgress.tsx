import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { stepIndex } from "../bookingCopy";
import type { BookingStep } from "../bookingTypes";
import { useBookingCopy } from "../useBookingCopy";

const VISIBLE_STEPS: BookingStep[] = [
  "dates",
  "cars",
  "customer",
  "driver",
  "extras",
  "review",
  "payment",
];

type BookingProgressProps = {
  current: BookingStep;
};

export function BookingProgress({ current }: BookingProgressProps) {
  const book = useBookingCopy();
  const activeIndex = stepIndex(current);

  return (
    <div className="mb-10 flex items-center gap-2 overflow-x-auto pb-1">
      {VISIBLE_STEPS.map((step, index) => {
        const label = book.steps[step];
        const isActive = step === current;
        const isComplete = activeIndex > index;

        return (
          <div key={step} className="flex shrink-0 items-center gap-2">
            <div
              className={cn(
                "flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--logo-red)] text-white"
                  : isComplete
                    ? "bg-[var(--logo-red)]/12 text-[var(--logo-red)]"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <span className="grid size-5 place-items-center rounded-full bg-white/25 text-[11px] font-bold">
                {isComplete ? <Check className="size-3" /> : index + 1}
              </span>
              {label}
            </div>
            {index < VISIBLE_STEPS.length - 1 ? <div className="h-px w-6 bg-border" /> : null}
          </div>
        );
      })}
    </div>
  );
}
