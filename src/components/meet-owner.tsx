import { Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, Plane, Quote, Truck } from "lucide-react";

import { FleetPhoto } from "@/components/fleet-photo";
import { PhotoBadge } from "@/components/photo-badge";
import { FLEET_IMAGES } from "@/lib/fleet-images";
import { useI18n } from "@/i18n/provider";

const highlightIcons = [Plane, Truck, MessageCircle] as const;
const highlightKeys = ["airport", "hotel", "whatsapp"] as const;

export function MeetOwner() {
  const { messages } = useI18n();
  const m = messages.meetOwner;

  return (
    <section className="bg-white px-5 py-14 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-lg border border-black/[0.08] shadow-[0_12px_40px_rgb(0_0_0_0.08)]">
            <FleetPhoto
              src={FLEET_IMAGES.agyaAirportCur}
              alt={m.imageAlt}
              className="aspect-[4/3] w-full lg:aspect-[5/4]"
              fit="cover"
              imgClassName="object-[center_55%]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--logo-black)]/50 via-[var(--logo-black)]/10 to-transparent" />
            <PhotoBadge showDot className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)]">
              {m.imageCaption}
            </PhotoBadge>
          </div>

          <ul className="grid gap-2 sm:grid-cols-3">
            {highlightKeys.map((key, index) => {
              const Icon = highlightIcons[index];
              return (
                <li
                  key={key}
                  className="flex items-center gap-2 rounded-lg border border-black/[0.08] bg-[#f7f7f7] px-3 py-2.5 text-xs font-semibold text-[var(--logo-black)]"
                >
                  <Icon className="size-3.5 shrink-0 text-[var(--logo-red)]" strokeWidth={2} />
                  {m.highlights[key]}
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--logo-red)]">
            {m.eyebrow}
          </p>
          <h2 className="font-display text-3xl font-bold uppercase leading-[1.02] text-[var(--logo-black)] md:text-5xl">
            {m.titleLine1}
            <br />
            <span className="text-[var(--logo-red)]">{m.titleLine2}</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-black/65 md:text-lg">{m.body}</p>

          <div className="mt-6 rounded-lg border border-black/[0.08] bg-[#f7f7f7] p-5 md:p-6">
            <h3 className="font-display text-lg font-bold uppercase tracking-[0.04em] text-[var(--logo-black)] md:text-xl">
              {m.teamTitle}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-black/70 md:text-base">{m.teamBody}</p>
          </div>

          <blockquote className="mt-8 rounded-lg border border-black/[0.08] bg-[#f7f7f7] p-5">
            <Quote className="mb-3 size-5 text-[var(--logo-red)]" aria-hidden />
            <p className="text-sm italic leading-relaxed text-black/70 md:text-base">"{m.quote}"</p>
            <footer className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-black/45">
              {m.quoteAttribution}
            </footer>
          </blockquote>

          <Link
            to="/book"
            className="group mt-8 inline-flex h-12 items-center gap-2 rounded-[4px] bg-[var(--logo-red)] px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#c92228]"
          >
            {m.cta}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
