import { cn } from "@/lib/utils";

import { PaymentBrandBadges } from "./payment-brand-logos";

type SecurePaymentStripProps = {
  title: string;
  localBanksLabel: string;
  variant?: "footer" | "card";
  className?: string;
};

export function SecurePaymentStrip({
  title,
  localBanksLabel,
  variant = "footer",
  className,
}: SecurePaymentStripProps) {
  const isFooter = variant === "footer";

  return (
    <div
      className={cn(
        isFooter
          ? "border-y border-white/10 py-6 md:py-7"
          : "rounded-xl border border-black/[0.06] bg-[#fafafa] px-4 py-4 sm:px-5",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4",
          isFooter ? "md:flex-row md:items-center md:justify-between md:gap-6" : "sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        )}
      >
        <p
          className={cn(
            "shrink-0 text-center text-[11px] font-bold uppercase tracking-[0.18em]",
            isFooter ? "text-white md:text-left" : "text-[var(--logo-black)] sm:text-left",
          )}
        >
          {title}
        </p>
        <PaymentBrandBadges
          localBanksLabel={localBanksLabel}
          dark={isFooter}
          className={isFooter ? "md:justify-end" : "sm:justify-end"}
        />
      </div>
    </div>
  );
}
