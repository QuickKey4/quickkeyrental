import type React from "react";
import { CalendarDays } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type PremiumDateCalendarProps = {
  label: string;
  helper?: string;
  selected: Date;
  defaultMonth?: Date;
  minDate: Date;
  onSelect: (date: Date) => void;
  className?: string;
  compact?: boolean;
  showIntro?: boolean;
};

export function PremiumDateCalendar({
  label,
  helper,
  selected,
  defaultMonth,
  minDate,
  onSelect,
  className,
  compact = false,
  showIntro = true,
}: PremiumDateCalendarProps) {
  return (
    <div className={cn("min-w-0", className)}>
      {showIntro ? (
        <div className={cn("mb-3 rounded-2xl bg-background-secondary/80", compact ? "p-3" : "p-4")}>
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 grid shrink-0 place-items-center rounded-xl bg-primary/10 text-primary",
                compact ? "size-8" : "size-9",
              )}
            >
              <CalendarDays className={compact ? "size-3.5" : "size-4"} />
            </span>
            <div>
              <p
                className={cn(
                  "font-display font-bold text-[var(--logo-black)]",
                  compact ? "text-sm" : "text-base",
                )}
              >
                {label}
              </p>
              {helper ? (
                <p
                  className={cn(
                    "mt-0.5 leading-relaxed text-muted-foreground",
                    compact ? "text-xs" : "text-sm",
                  )}
                >
                  {helper}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <Calendar
        mode="single"
        numberOfMonths={1}
        selected={selected}
        defaultMonth={defaultMonth ?? selected}
        onDayClick={onSelect}
        disabled={(date) => date < minDate}
        className="w-full p-0"
        classNames={{
          root: cn("w-full", compact ? "[--cell-size:2.25rem]" : "[--cell-size:2.75rem]"),
          months: "relative flex w-full flex-col gap-0",
          month: cn("w-full", compact ? "gap-2" : "gap-3"),
          month_caption: cn(
            "flex w-full items-center justify-center px-12 font-display font-bold text-[var(--logo-black)]",
            compact ? "h-9 text-sm" : "h-11 text-base",
          ),
          button_previous: cn(
            "left-2 rounded-full border border-border bg-white text-[var(--logo-black)] shadow-sm transition hover:border-primary/30 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/30",
            compact ? "top-1 size-8" : "top-1.5 size-10",
          ),
          button_next: cn(
            "right-2 rounded-full border border-border bg-white text-[var(--logo-black)] shadow-sm transition hover:border-primary/30 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/30",
            compact ? "top-1 size-8" : "top-1.5 size-10",
          ),
          weekdays: "grid grid-cols-7 gap-1",
          weekday: cn(
            "text-center font-bold uppercase tracking-[0.12em] text-muted-foreground",
            compact ? "h-7 text-[0.62rem]" : "h-8 text-[0.68rem]",
          ),
          week: "mt-1 grid w-full grid-cols-7 gap-1",
          day: "relative aspect-square h-auto w-full rounded-xl p-0 text-center",
          today: "rounded-xl bg-primary/8 text-primary",
          selected: "rounded-xl",
          disabled: "text-muted-foreground opacity-35",
          outside: "text-muted-foreground opacity-35",
        }}
        components={{
          DayButton: (props) => <PremiumSingleDateButton {...props} compact={compact} />,
        }}
      />
    </div>
  );
}

function PremiumSingleDateButton({
  className,
  children,
  day,
  modifiers,
  compact,
  ...props
}: React.ComponentProps<typeof import("@/components/ui/calendar").CalendarDayButton> & {
  compact?: boolean;
}) {
  const isSelected = modifiers.selected;

  return (
    <button
      {...props}
      type="button"
      data-day={day.date.toLocaleDateString()}
      className={cn(
        "relative z-10 grid size-full place-items-center rounded-xl font-semibold outline-none transition duration-200",
        "hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "disabled:pointer-events-none disabled:text-muted-foreground disabled:opacity-35",
        "motion-reduce:transition-none",
        compact ? "min-h-9 min-w-9 text-xs" : "min-h-[2.75rem] min-w-[2.75rem] text-sm",
        modifiers.today && !isSelected && "text-primary",
        isSelected &&
          "bg-[var(--logo-red)] text-white shadow-[0_10px_22px_rgba(232,40,46,0.22)] hover:bg-[var(--logo-red)] hover:text-white",
        className,
      )}
    >
      <span>{children}</span>
    </button>
  );
}
