import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  Car,
  CreditCard,
  FileText,
  Headphones,
  LayoutDashboard,
  LogOut,
  Settings,
  Tag,
  Users,
  ClipboardList,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

import { useAdminAuth } from "./admin-auth-provider";
import { useAdminI18n } from "./hooks/use-admin-i18n";

const NAV = [
  { to: "/admin", icon: LayoutDashboard, labelKey: "dashboard", end: true },
  { to: "/admin/bookings", icon: ClipboardList, labelKey: "bookings" },
  { to: "/admin/fleet", icon: Car, labelKey: "fleet" },
  { to: "/admin/calendar", icon: CalendarDays, labelKey: "calendar" },
  { to: "/admin/customers", icon: Users, labelKey: "customers" },
  { to: "/admin/payments", icon: CreditCard, labelKey: "payments" },
  { to: "/admin/discounts", icon: Tag, labelKey: "discounts" },
  { to: "/admin/documents", icon: FileText, labelKey: "documents" },
  { to: "/admin/support", icon: Headphones, labelKey: "support" },
  { to: "/admin/settings", icon: Settings, labelKey: "settings" },
] as const;

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { signOut } = useAdminAuth();
  const navigate = useNavigate();
  const { t } = useAdminI18n();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-8 shrink-0 px-2">
        <Link to="/admin" onClick={onNavigate} className="inline-flex flex-col gap-1">
          <Logo size="sm" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logo-red)]">
            {t.portal}
          </span>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
        {NAV.map((item) => {
          const active =
            "end" in item && item.end
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--logo-red)] text-white shadow-[0_4px_14px_rgba(232,40,46,0.25)]"
                  : "text-[var(--logo-black)] hover:bg-black/[0.04]",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {t.nav[item.labelKey]}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto shrink-0 border-t border-black/[0.06] pt-4">
        <div className="mb-3 px-2">
          <p className="truncate text-sm font-semibold text-[var(--logo-black)]">{t.operatorName}</p>
          <p className="truncate text-xs text-muted-foreground">{t.operatorConsole}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            signOut();
            onNavigate?.();
            void navigate({ to: "/admin/login" });
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--logo-black)] hover:bg-black/[0.04]"
        >
          <LogOut className="size-[18px]" />
          {t.logout}
        </button>
      </div>
    </div>
  );
}
