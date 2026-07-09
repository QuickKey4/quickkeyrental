import { Link } from "@tanstack/react-router";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { useMemo } from "react";

import { Logo } from "@/components/logo";
import { SecurePaymentStrip } from "@/components/secure-payment-strip";
import { BRAND } from "@/lib/brand";
import { contactHrefs } from "@/lib/contact-links";
import { interpolate } from "@/i18n/interpolate";
import { useI18n } from "@/i18n/provider";

export function SiteFooter() {
  const { messages } = useI18n();

  const cols = useMemo(
    () => [
      {
        title: messages.footer.explore,
        links: [
          { label: messages.nav.home, href: "/" },
          { label: messages.nav.fleet, href: "/#fleet" },
          { label: messages.nav.locations, href: "/#destinations" },
          { label: messages.common.bookNow, href: "/book" },
        ],
      },
      {
        title: messages.footer.company,
        showContact: true,
        links: [
          { label: messages.nav.about, href: "/#about" },
          { label: messages.nav.contact, href: "/#contact" },
        ],
      },
    ],
    [messages],
  );

  return (
    <footer
      id="contact"
      className="scroll-mt-28 bg-[var(--logo-black)] px-5 pb-10 pt-16 text-white md:px-8 md:pt-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-10 md:mb-16 md:grid-cols-[1.4fr_1fr_1fr] md:gap-8">
          <div>
            <Link to="/" className="mb-5 inline-flex" aria-label={messages.nav.homeAria}>
              <Logo size="lg" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/65">{messages.footer.blurb}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/book"
                className="inline-flex items-center gap-2 rounded-md bg-[var(--logo-red)] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#c92228]"
              >
                {messages.common.bookNow}
                <ArrowRight className="size-4" />
              </Link>
              <a
                href={contactHrefs.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-[var(--logo-red)] hover:text-[var(--logo-red)]"
              >
                {messages.footer.whatsappCta}
              </a>
            </div>
          </div>
          {cols.map((column) => (
            <div key={column.title}>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-white/90">
                {column.title}
              </p>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/65 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              {column.showContact ? (
                <ul className="mt-5 space-y-2 text-sm text-white/65">
                  <li className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-[var(--logo-red)]" />
                    {messages.brand.address}
                  </li>
                  <li className="flex items-start gap-2">
                    <Phone className="mt-0.5 size-4 shrink-0 text-[var(--logo-red)]" />
                    <div>
                      <p className="text-xs font-semibold text-white">{messages.footer.customerCare}</p>
                      <a
                        href={`tel:${BRAND.customerCarePhone.tel}`}
                        className="hover:text-white"
                      >
                        {BRAND.customerCarePhone.display}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0 text-[var(--logo-red)]" />
                    <a href={`mailto:${BRAND.email}`} className="hover:text-white">
                      {BRAND.email}
                    </a>
                  </li>
                </ul>
              ) : null}
            </div>
          ))}
        </div>

        <SecurePaymentStrip
          variant="footer"
          title={messages.footer.securePayment}
          localBanksLabel={messages.footer.localBanksShort}
          className="mb-10 md:mb-12"
        />

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-xs text-white/50">
            {interpolate(messages.footer.rights, {
              year: new Date().getFullYear(),
              brand: BRAND.name,
            })}
          </p>
          <p className="text-xs text-white/50">{messages.footer.serving}</p>
        </div>
      </div>
    </footer>
  );
}
