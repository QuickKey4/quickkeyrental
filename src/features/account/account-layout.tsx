import { Menu, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { Logo } from "@/components/logo";
import { SIDEBAR_BOTTOM_OFFSET } from "@/components/sticky-trust-strip";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

import { AccountNav } from "./account-nav";
import { useAuth } from "./auth-provider";

type AccountLayoutProps = {
  children: ReactNode;
};

export function AccountLayout({ children }: AccountLayoutProps) {
  const { messages } = useI18n();
  const { profile, user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  const firstName =
    profile?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    messages.account.nav.greetingFallback;

  return (
    <div className="account-shell min-h-screen bg-[#f4f4f2]">
      <aside
        className={`fixed top-0 left-0 z-40 hidden w-[272px] border-r border-black/[0.06] bg-white lg:flex lg:flex-col ${SIDEBAR_BOTTOM_OFFSET}`}
      >
        <div className="flex h-full min-h-0 flex-col px-5 pt-6 pb-4">
          <AccountNav variant="sidebar" />
        </div>
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/95 backdrop-blur-md lg:hidden">
          <div className="account-mobile-bar flex h-16 w-full items-center justify-between gap-3">
            <Link to="/" className="shrink-0" aria-label={messages.nav.homeAria}>
              <Logo size="sm" />
            </Link>
            <p className="truncate text-sm font-semibold text-[var(--logo-black)]">{firstName}</p>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-black/10 text-[var(--logo-black)]"
              aria-label={messages.nav.toggleMenu}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </header>

        {mobileNavOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              aria-label={messages.nav.closeMenu}
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-[min(100%,300px)] overflow-y-auto bg-white p-5 shadow-2xl lg:hidden">
              <AccountNav variant="drawer" onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </>
        ) : null}

        <main className="min-h-[calc(100vh-4rem)] lg:min-h-screen">
          <div className="account-content-shell">
            <div className="account-surface">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

type AccountContentSize = "narrow" | "default" | "wide";

export function AccountContent({
  children,
  size = "default",
  className,
}: {
  children: ReactNode;
  size?: AccountContentSize;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full",
        size === "narrow" && "mx-auto max-w-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AccountDashboardGrid({
  main,
  sidebar,
  className,
}: {
  main: ReactNode;
  sidebar: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_min(100%,300px)] xl:gap-8",
        className,
      )}
    >
      <div className="min-w-0 space-y-8">{main}</div>
      <aside className="min-w-0 space-y-4 xl:sticky xl:top-8 xl:self-start">{sidebar}</aside>
    </div>
  );
}
