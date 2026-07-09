import type { ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AccountCard({
  className,
  children,
  padding = "default",
}: {
  className?: string;
  children: ReactNode;
  padding?: "default" | "lg" | "none";
}) {
  return (
    <div
      className={cn(
        "account-inner-card overflow-hidden rounded-3xl border border-black/[0.06] bg-[#fafafa] shadow-[0_2px_12px_rgba(16,16,16,0.04)]",
        padding === "lg" && "p-6 sm:p-8",
        padding === "default" && "p-5 sm:p-6",
        padding === "none" && "p-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AccountPageHeader({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <header className="space-y-1">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--logo-red)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--logo-black)] sm:text-3xl">
        {title}
      </h1>
      {subtitle ? <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}

export function AccountSectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 className="font-display text-lg font-bold text-[var(--logo-black)] sm:text-xl">{title}</h2>
      {action}
    </div>
  );
}

export function AccountDetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex gap-3 py-3 first:pt-0 last:pb-0">
      {icon ? (
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--logo-red)]/8 text-[var(--logo-red)]">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <div className="mt-1 text-sm font-medium text-[var(--logo-black)]">{value}</div>
      </div>
    </div>
  );
}

export function AccountPrimaryButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button className={cn(className)} size="lg" {...props}>
      {children}
    </Button>
  );
}

export function AccountSecondaryButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button variant="outline" size="lg" className={cn(className)} {...props}>
      {children}
    </Button>
  );
}
