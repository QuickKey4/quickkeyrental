import { cn } from "@/lib/utils";

export function BookingStatusBadge({
  label,
  variant,
  muted,
  className,
}: {
  label: string;
  variant: string;
  muted?: boolean;
  className?: string;
}) {
  const tone =
    variant === "confirmed" || variant === "paid"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200/80"
      : variant === "cancelled" || variant === "failed"
        ? "bg-red-50 text-red-700 ring-red-200/80"
        : muted
          ? "bg-black/[0.04] text-muted-foreground ring-black/[0.06]"
          : "bg-amber-50 text-amber-800 ring-amber-200/80";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
