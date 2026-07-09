import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { contactHrefs } from "@/lib/contact-links";
import { useI18n } from "@/i18n/provider";

export function CtaBanner() {
  const { messages } = useI18n();

  return (
    <section className="relative bg-white px-5 py-14 md:px-8 md:py-24">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-lg bg-[var(--logo-black)] p-6 sm:p-8 md:p-16 lg:p-20">
        <div className="absolute -bottom-1/2 -right-1/4 size-[600px] rounded-full bg-[var(--logo-red)]/20 blur-3xl" />

        <div className="relative z-10 max-w-2xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--logo-red)]">
            {messages.cta.eyebrow}
          </p>
          <h2 className="mb-4 font-display text-2xl font-bold uppercase leading-[1.05] text-white sm:mb-6 sm:text-3xl md:text-5xl">
            {messages.cta.title}
          </h2>
          <p className="mb-6 max-w-lg text-sm leading-relaxed text-white/75 sm:mb-8 sm:text-base md:mb-10 md:text-lg">
            {messages.cta.body}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/book"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[var(--logo-red)] px-6 text-sm font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#c92228] sm:w-auto md:h-14 md:px-7"
            >
              {messages.cta.bookCar}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href={contactHrefs.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-full items-center justify-center rounded-md border border-white/20 px-5 text-sm font-bold uppercase tracking-[0.08em] text-white transition-colors hover:border-white/40 sm:w-auto md:h-14 md:px-6"
            >
              {messages.cta.callBooking}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
