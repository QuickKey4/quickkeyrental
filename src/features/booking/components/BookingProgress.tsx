import { useEffect, useRef } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { stepIndex } from "../bookingCopy";
import type { BookingStep } from "../bookingTypes";
import { useBookingCopy } from "../useBookingCopy";

const VISIBLE_STEPS: BookingStep[] = ["dates", "cars", "customer", "extras", "review"];

type BookingProgressProps = {
  current: BookingStep;
  onStepSelect?: (step: BookingStep) => void;
};

export function BookingProgress({ current, onStepSelect }: BookingProgressProps) {
  const book = useBookingCopy();
  const visibleCurrent = current === "payment" ? "review" : current;
  const activeIndex = Math.min(stepIndex(current), VISIBLE_STEPS.length - 1);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [current]);

  return (
    <div className="mb-10 flex items-center gap-2 overflow-x-auto pb-1">
      {VISIBLE_STEPS.map((step, index) => {
        const label = book.steps[step];
        const isActive = step === visibleCurrent;
        const isComplete = activeIndex > index;
        const canSelect = isComplete && Boolean(onStepSelect);

        return (
          <div key={step} className="flex shrink-0 items-center gap-2">
            <button
              ref={isActive ? activeRef : null}
              type="button"
              disabled={!canSelect}
              onClick={() => onStepSelect?.(step)}
              className={cn(
                "flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--logo-red)] text-white"
                  : isComplete
                    ? "bg-[var(--logo-red)]/12 text-[var(--logo-red)]"
                    : "bg-muted text-muted-foreground",
                canSelect
                  ? "cursor-pointer hover:bg-[var(--logo-red)]/18"
                  : "cursor-default disabled:opacity-100",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="grid size-5 place-items-center rounded-full bg-white/25 text-[11px] font-bold">
                {isComplete ? <Check className="size-3" /> : index + 1}
              </span>
              {label}
            </button>
            {index < VISIBLE_STEPS.length - 1 ? <div className="h-px w-6 bg-border" /> : null}
          </div>
        );
      })}
    </div>
  );
}
