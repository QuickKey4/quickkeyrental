import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  FileText,
  Gift,
  Headphones,
  LayoutDashboard,
  LogOut,
  Plus,
  User,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

import { useAuth } from "./auth-provider";
import { WhatsAppSupportButton } from "./components/whatsapp-support-button";

const navItems = [
  { to: "/account", icon: LayoutDashboard, labelKey: "dashboard" as const, end: true },
  { to: "/account/bookings", icon: CalendarDays, labelKey: "bookings" as const },
  { to: "/account/profile", icon: User, labelKey: "profile" as const },
  { to: "/account/documents", icon: FileText, labelKey: "documents" as const },
  { to: "/account/rewards", icon: Gift, labelKey: "rewards" as const },
  { to: "/account/support", icon: Headphones, labelKey: "support" as const },
] as const;

type AccountNavProps = {
  onNavigate?: () => void;
  className?: string;
  variant?: "sidebar" | "drawer";
};

export function AccountNav({ onNavigate, className, variant = "sidebar" }: AccountNavProps) {
  const { messages } = useI18n();
  const { signOut } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {variant === "sidebar" ? (
        <div className="mb-6 shrink-0 px-2">
          <Link to="/" className="inline-flex" aria-label={messages.nav.homeAria} onClick={onNavigate}>
            <Logo size="sm" />
          </Link>
        </div>
      ) : null}

      <Link
        to="/book"
        onClick={onNavigate}
        className="mb-5 inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--logo-red)] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(232,40,46,0.22)] transition-all hover:bg-[#c92228]"
      >
        <Plus className="size-4" />
        {messages.common.bookNow}
      </Link>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain">
        {navItems.map((item) => {
          const active =
            "end" in item && item.end
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          const label = messages.account.nav[item.labelKey];

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                active
                  ? "bg-[var(--logo-red)] text-white shadow-[0_6px_16px_rgba(232,40,46,0.2)]"
                  : "text-[var(--logo-black)] hover:bg-black/[0.04]",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto shrink-0 space-y-3 border-t border-black/[0.06] pt-4">
        <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {messages.account.supportPage.title}
        </p>
        <WhatsAppSupportButton className="w-full justify-center rounded-xl py-3" />
        <button
          type="button"
          onClick={() => {
            void signOut();
            onNavigate?.();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[var(--logo-black)] transition-colors hover:bg-black/[0.04]"
        >
          <LogOut className="size-[18px]" />
          {messages.account.nav.logout}
        </button>
      </div>
    </div>
  );
}
