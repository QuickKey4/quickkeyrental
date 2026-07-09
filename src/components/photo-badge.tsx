import { cn } from "@/lib/utils";

type PhotoBadgeProps = {
  children: React.ReactNode;
  className?: string;
  showDot?: boolean;
};

export function PhotoBadge({ children, className, showDot = false }: PhotoBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground glass-strong shadow-[var(--shadow-sm)] sm:text-xs",
        className,
      )}
    >
      {showDot ? <span className="size-1.5 shrink-0 rounded-full bg-success" aria-hidden /> : null}
      {children}
    </span>
  );
}
