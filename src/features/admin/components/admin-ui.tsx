import type { ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAdminI18n } from "../hooks/use-admin-i18n";

export function AdminCard({
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
        "overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_16px_rgba(16,16,16,0.05)]",
        padding === "lg" && "p-6",
        padding === "default" && "p-5",
        padding === "none" && "p-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--logo-black)] lg:text-3xl">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function AdminMetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "red" | "green";
}) {
  return (
    <AdminCard>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-3xl font-bold",
          tone === "red" && "text-[var(--logo-red)]",
          tone === "green" && "text-emerald-600",
          tone === "default" && "text-[var(--logo-black)]",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </AdminCard>
  );
}

export function AdminBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red" | "blue";
}) {
  const styles = {
    neutral: "bg-black/[0.05] text-foreground",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        styles[tone],
      )}
    >
      {children}
    </span>
  );
}

export function AdminButton({
  className,
  variant = "primary",
  children,
  ...props
}: Omit<ButtonProps, "variant"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const mappedVariant =
    variant === "primary"
      ? "default"
      : variant === "secondary"
        ? "outline"
        : variant === "danger"
          ? "danger"
          : "ghost";

  return (
    <Button variant={mappedVariant} className={className} {...props}>
      {children}
    </Button>
  );
}

export function operationalBadgeTone(
  status: string,
): "neutral" | "green" | "amber" | "red" | "blue" {
  if (status === "active") return "blue";
  if (status === "confirmed") return "green";
  if (status === "pending") return "amber";
  if (status === "cancelled") return "red";
  return "neutral";
}

export function fleetBadgeTone(
  status: string,
): "neutral" | "green" | "amber" | "red" | "blue" {
  if (status === "available") return "green";
  if (status === "on_rental") return "blue";
  if (status === "maintenance") return "amber";
  if (status === "disabled") return "red";
  return "neutral";
}

export function AdminContactButtons({
  phone,
  email,
  className,
}: {
  phone: string;
  email: string;
  className?: string;
}) {
  const { t } = useAdminI18n();
  const waPhone = phone.replace(/\D/g, "");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer">
        <AdminButton className="w-full" variant="secondary">
          {t.bookingDetail.contactActions.whatsapp}
        </AdminButton>
      </a>
      <a href={`mailto:${email}`}>
        <AdminButton className="w-full" variant="secondary">
          {t.bookingDetail.contactActions.email}
        </AdminButton>
      </a>
      <a href={`tel:${phone}`}>
        <AdminButton className="w-full" variant="secondary">
          {t.bookingDetail.contactActions.phone}
        </AdminButton>
      </a>
    </div>
  );
}

const inputClassName =
  "mt-1.5 h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-[var(--logo-red)]";

export function AdminField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export { inputClassName as adminInputClassName };
