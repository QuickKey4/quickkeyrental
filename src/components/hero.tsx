import { ArrowRight, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { BookingWidget } from "@/components/booking-widget";
import { HeroTrustBar } from "@/components/hero-trust-bar";
import { SiteHeader } from "@/components/site-header";
import { contactHrefs } from "@/lib/contact-links";
import { HERO_PANORAMA } from "@/lib/fleet-images";
import { useI18n } from "@/i18n/provider";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function Hero() {
  const { messages } = useI18n();
  const m = messages.hero;
  const benefits = [m.benefits.airport, m.benefits.hotel, m.benefits.insurance];

  return (
    <section className="relative w-full bg-white md:bg-[#7eb9dc]">
      <div className="relative w-full overflow-hidden bg-[#7eb9dc]">
        <div className="relative max-md:min-h-[24rem] md:aspect-[2560/1270]">
          <img
            src={HERO_PANORAMA.src}
            srcSet={HERO_PANORAMA.srcSet}
            sizes="100vw"
            alt={m.imageAlt}
            width={HERO_PANORAMA.width}
            height={HERO_PANORAMA.height}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[center_42%] md:object-[center_50%]"
          />

          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.9)_50%,rgba(255,255,255,0.5)_82%,transparent_100%)] md:bg-[linear-gradient(105deg,rgba(255,255,255,0.94)_0%,rgba(255,255,255,0.78)_32%,rgba(255,255,255,0.35)_58%,transparent_78%)]"
            aria-hidden
          />

          <SiteHeader appearance="brand" overlay />

          <div className="relative z-10 mx-auto flex max-w-7xl items-start px-4 pb-5 pt-[5.25rem] sm:px-6 sm:pb-6 sm:pt-[6rem] md:absolute md:inset-0 md:px-8 md:pb-0 md:pt-[6.5rem] lg:px-10 lg:pt-28">
            <div className="w-full max-w-[34rem] sm:max-w-[38rem] lg:max-w-[42rem]">
              <p className="hero-text-legible text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--logo-red)] sm:text-[11px]">
                {m.eyebrow}
              </p>

              <h1 className="hero-text-legible mt-2 font-display text-[1.72rem] font-bold uppercase leading-[0.95] tracking-[0.03em] text-[var(--logo-black)] min-[420px]:text-[2rem] sm:mt-3 sm:text-[2.4rem] lg:text-[2.8rem] xl:text-[3rem]">
                {m.titleLine1}
                <br />
                {m.titleLine2}
                <br />
                <span className="text-[var(--logo-red)]">{m.titleHighlight}</span>
              </h1>

              <span className="mt-3 inline-block h-0.5 w-14 bg-[var(--logo-red)] sm:mt-4" aria-hidden />

              <p className="hero-text-legible mt-3 text-base font-bold uppercase tracking-[0.04em] text-[var(--logo-black)] sm:mt-4 sm:text-lg">
                {m.subtitle}
              </p>

              <ul className="hero-text-legible mt-3 hidden space-y-1.5 sm:mt-4 sm:block">
                {benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-2 text-sm font-medium text-[var(--logo-black)]"
                  >
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--logo-red)]" strokeWidth={2.5} />
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="mt-4 hidden flex-wrap gap-2.5 sm:mt-5 sm:flex">
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 rounded-[4px] bg-[var(--logo-red)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#c92228] sm:px-6 sm:py-3 sm:text-[11px]"
                >
                  {m.cta}
                  <ArrowRight className="size-3.5" strokeWidth={2.5} />
                </Link>
                <a
                  href={contactHrefs.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-[4px] border-2 border-[var(--logo-black)] bg-white/90 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--logo-black)] backdrop-blur-sm transition-colors hover:border-[var(--logo-red)] hover:text-[var(--logo-red)] sm:px-6 sm:py-3 sm:text-[11px]"
                >
                  <WhatsAppIcon className="size-3.5" />
                  {m.ctaWhatsapp}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 bg-white px-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl max-md:pt-2 md:-translate-y-12 lg:-translate-y-14">
          <BookingWidget variant="brand" />
        </div>
      </div>

      <HeroTrustBar />
    </section>
  );
}
