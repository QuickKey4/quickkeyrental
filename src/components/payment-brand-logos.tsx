import { cn } from "@/lib/utils";

function BadgeShell({
  children,
  className,
  dark = false,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-9 min-w-[3.25rem] items-center justify-center rounded-full px-3",
        dark ? "bg-white/95 shadow-sm" : "bg-white shadow-[0_1px_8px_rgba(16,16,16,0.08)] ring-1 ring-black/[0.06]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function VisaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 16" className={cn("h-3.5 w-auto", className)} aria-hidden>
      <path
        fill="#1434CB"
        d="M19.2 15.5h-3.1L17.5 4.5h3.1l-1.4 11ZM30.8 4.7c-.6-.2-1.6-.5-2.8-.5-3.1 0-5.2 1.6-5.2 4 0 1.7 1.6 2.7 2.8 3.3 1.2.6 1.6 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.3 0-2-.3-3-.8l-.4-.2-.5 2.8c.8.4 2.2.7 3.7.7 3.3 0 5.4-1.6 5.4-4.1 0-1.4-.8-2.4-2.6-3.3-1.1-.5-1.7-.9-1.7-1.4 0-.5.5-1 1.6-1 .9 0 1.6.2 2.1.4l.3.1.5-2.7ZM39.8 4.5h-2.4c-.7 0-1.3.2-1.6 1l-4.6 11h3.2l.6-1.7h3.9l.4 1.7H42l-2.2-11Zm-3.8 7.1.6-1.6c0 .1 1.2-3.1 1.2-3.1l.7 3.1h-2.5ZM16.1 4.5l-3 11h-3l3-11h3Z"
      />
      <path fill="#F7B600" d="M12.8 4.5 10.2 12.1 9.8 9.9 8.6 5.6c-.2-.8-.8-1.1-1.5-1.1H3.1l-.1.4c1.2.3 2.5.7 3.3 1.2L7.6 15.5h3.1l4.8-11h.3Z" />
    </svg>
  );
}

export function MastercardLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 22" className={cn("h-5 w-auto", className)} aria-hidden>
      <circle cx="13" cy="11" r="8" fill="#EB001B" />
      <circle cx="23" cy="11" r="8" fill="#F79E1B" />
      <path
        fill="#FF5F00"
        d="M18 5.2a8 8 0 0 1 0 11.6A8 8 0 0 1 18 5.2Z"
      />
    </svg>
  );
}

export function AmexLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 42 16" className={cn("h-3.5 w-auto", className)} aria-hidden>
      <rect width="42" height="16" rx="2" fill="#006FCF" />
      <path
        fill="#fff"
        d="M6.2 5.2h1.5l.9 2.2.9-2.2h1.5v5.6H10v-3.4l-1 2.4H9.1l-1-2.4v3.4H6.2V5.2Zm7.1 0h2.6c1.4 0 2.4.8 2.4 2.1 0 1.4-1 2.1-2.5 2.1h-2.5V5.2Zm2.5 3.3c.7 0 1.1-.3 1.1-.9 0-.6-.4-.9-1.1-.9h-.8v1.8h.8Zm4.8-3.3h3.8l.6 1.5.6-1.5h3.8v5.6h-1.5V6.8l-.9 2.1h-1.3l-.9-2.1v3.9h-1.5V5.2Zm12.2 0h4.8c1.2 0 2 .5 2 1.4 0 .6-.4 1-1 1.2.8.2 1.3.7 1.3 1.5 0 1.1-.9 1.6-2.4 1.6h-4.7V5.2Zm3.3 2.1c.6 0 .9-.2.9-.6 0-.4-.3-.6-.9-.6h-1.5v1.2h1.5Zm.2 2.3c.7 0 1-.3 1-.7 0-.5-.4-.7-1.1-.7h-1.6v1.4h1.7Z"
      />
    </svg>
  );
}

export function IdealLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 52 18" className={cn("h-4 w-auto", className)} aria-hidden>
      <rect width="52" height="18" rx="3" fill="#CC0066" />
      <circle cx="10" cy="9" r="5.5" fill="#fff" />
      <path fill="#CC0066" d="M10 5.8c1.8 0 3.2 1.4 3.2 3.2S11.8 12.2 10 12.2 6.8 10.8 6.8 9 8.2 5.8 10 5.8Z" />
      <text x="19" y="12.5" fill="#fff" fontSize="8" fontWeight="700" fontFamily="system-ui,sans-serif">
        iDEAL
      </text>
    </svg>
  );
}

export function LocalBanksLogo({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--logo-black)]",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function PaymentBrandBadges({
  localBanksLabel,
  dark = false,
  className,
}: {
  localBanksLabel: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2 sm:gap-2.5", className)}>
      <BadgeShell dark={dark} aria-label="Visa">
        <VisaLogo />
      </BadgeShell>
      <BadgeShell dark={dark} aria-label="Mastercard">
        <MastercardLogo />
      </BadgeShell>
      <BadgeShell dark={dark} aria-label="American Express">
        <AmexLogo />
      </BadgeShell>
      <BadgeShell dark={dark} aria-label="iDEAL">
        <IdealLogo />
      </BadgeShell>
      <BadgeShell dark={dark} className="min-w-[5.5rem] px-3.5" aria-label={localBanksLabel}>
        <LocalBanksLogo label={localBanksLabel} />
      </BadgeShell>
    </div>
  );
}
