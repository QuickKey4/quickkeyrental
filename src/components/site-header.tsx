import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { useCallback, useMemo, useState, type MouseEvent } from "react";

import { Logo } from "@/components/logo";
import { useAuth } from "@/features/account/auth-provider";
import { useI18n } from "@/i18n/provider";
import { hashFromHref, pathFromHref, scrollToSectionWithRetry } from "@/lib/scroll-to-section";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  appearance?: "default" | "brand";
  overlay?: boolean;
};

export function SiteHeader({ appearance = "brand", overlay = false }: SiteHeaderProps) {
  const { messages } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isBrand = appearance === "brand" || appearance === "default";

  const links = useMemo(
    () => [
      { label: messages.nav.home, href: "/", active: pathname === "/" },
      { label: messages.nav.fleet, href: "/#fleet", active: false },
      { label: messages.nav.locations, href: "/#destinations", active: false },
      { label: messages.nav.about, href: "/#about", active: false },
      { label: messages.nav.contact, href: "/#contact", active: false },
    ],
    [messages, pathname],
  );

  const closeMenu = () => setOpen(false);

  const handleNavClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: string) => {
      const sectionId = hashFromHref(href);
      if (!sectionId) return;

      const targetPath = pathFromHref(href);
      if (pathname !== targetPath) return;

      event.preventDefault();
      closeMenu();
      window.history.pushState(null, "", `#${sectionId}`);
      window.dispatchEvent(new Event("hashchange"));
      scrollToSectionWithRetry(sectionId);
    },
    [pathname],
  );

  if (!isBrand) return null;

  return (
    <header
      className={cn(
        "z-50 border-b border-black/[0.06] backdrop-blur-sm",
        overlay ? "absolute inset-x-0 top-0 bg-white/90" : "relative bg-white",
      )}
    >
      <div className="mx-auto grid h-[5.25rem] max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-5 md:px-8">
        <Link
          to="/"
          className="shrink-0"
          onClick={closeMenu}
          aria-label={messages.nav.homeAria}
        >
          <Logo size="md" />
        </Link>

        <nav className="hidden justify-self-center lg:flex">
          <ul className="flex items-center gap-6 xl:gap-8">
            {links.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <a
                  href={link.href}
                  onClick={(event) => handleNavClick(event, link.href)}
                  className={cn(
                    "relative py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--logo-black)] transition-colors hover:text-[var(--logo-red)] xl:text-xs",
                    link.active && "text-[var(--logo-black)]",
                  )}
                >
                  {link.label}
                  {link.active ? (
                    <span
                      className="absolute inset-x-0 -bottom-0.5 mx-auto h-0.5 w-full max-w-[2.25rem] bg-[var(--logo-red)]"
                      aria-hidden
                    />
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 justify-self-end lg:flex">
          <Link
            to={user ? "/account" : "/account/login"}
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--logo-black)] transition-colors hover:text-[var(--logo-red)] xl:text-xs"
          >
            {user ? messages.nav.myAccount : messages.nav.accountLogin}
          </Link>
          <Link
            to="/book"
            className="inline-flex items-center gap-2 rounded-[4px] bg-[var(--logo-red)] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#c92228] xl:text-xs"
          >
            {messages.common.bookNow}
            <ArrowRight className="size-4" strokeWidth={2.5} />
          </Link>
        </div>

        <div className="col-start-3 flex items-center justify-end gap-2 lg:hidden">
          <Link
            to={user ? "/account" : "/account/login"}
            className="hidden rounded-[4px] border border-black/10 px-2.5 py-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--logo-black)] min-[380px]:inline-flex"
          >
            {user ? messages.nav.myAccount : messages.nav.accountLogin}
          </Link>
          <Link
            to="/book"
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-[var(--logo-red)] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
          >
            {messages.common.bookNow}
            <ArrowRight className="size-3.5" />
          </Link>
          <button
            aria-label={messages.nav.toggleMenu}
            aria-expanded={open}
            className="inline-flex size-10 items-center justify-center rounded-[4px] border border-black/10 text-[var(--logo-black)]"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-black/[0.06] bg-white px-5 py-3 lg:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((link) => (
              <li key={`${link.href}-${link.label}-mobile`}>
                <a
                  href={link.href}
                  onClick={(event) => {
                    handleNavClick(event, link.href);
                    closeMenu();
                  }}
                  className={cn(
                    "block rounded-[4px] px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--logo-black)] hover:bg-black/[0.04]",
                    link.active && "text-[var(--logo-red)]",
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                to={user ? "/account" : "/account/login"}
                onClick={closeMenu}
                className="block rounded-[4px] px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--logo-black)] hover:bg-black/[0.04]"
              >
                {user ? messages.nav.myAccount : messages.nav.accountLogin}
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}
