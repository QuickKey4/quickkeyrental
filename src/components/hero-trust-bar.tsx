import type { ComponentType } from "react";
import { Palmtree, Plane, ShieldCheck, Star } from "lucide-react";

import { contactHrefs } from "@/lib/contact-links";
import { useI18n } from "@/i18n/provider";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

type TrustIconProps = { className?: string; strokeWidth?: number };

type TrustItem = {
  icon: ComponentType<TrustIconProps>;
  title: string;
  description: string;
  href?: string;
};

function TrustCell({ item }: { item: TrustItem }) {
  const Icon = item.icon;
  const content = (
    <>
      <Icon className="size-7 shrink-0 text-[var(--logo-red)] sm:size-8" strokeWidth={1.75} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--logo-black)] sm:text-xs sm:tracking-[0.14em]">
          {item.title}
        </p>
        <p className="mt-0.5 text-xs text-black/50 sm:text-sm">{item.description}</p>
      </div>
    </>
  );

  if (item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-[10.5rem] flex-1 items-center gap-3 px-4 py-5 transition-colors hover:bg-black/[0.02] sm:gap-4 sm:px-6 sm:py-7 lg:px-8"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex min-w-[10.5rem] flex-1 items-center gap-3 px-4 py-5 sm:gap-4 sm:px-6 sm:py-7 lg:px-8">
      {content}
    </div>
  );
}

export function HeroTrustBar() {
  const { messages } = useI18n();
  const t = messages.hero.trust;

  const items: TrustItem[] = [
    { icon: Star, title: t.google, description: t.googleDesc, href: contactHrefs.review },
    { icon: ShieldCheck, title: t.insurance, description: t.insuranceDesc },
    { icon: Plane, title: t.airport, description: t.airportDesc },
    {
      icon: WhatsAppIcon,
      title: t.whatsapp,
      description: t.whatsappDesc,
      href: contactHrefs.whatsapp,
    },
    { icon: Palmtree, title: t.local, description: t.localDesc },
  ];

  return (
    <section className="max-w-full overflow-x-clip bg-white pb-2 pt-6 sm:pb-4 sm:pt-8">
      <div className="mx-auto max-w-7xl overflow-x-auto px-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max divide-x divide-black/[0.08] border-y border-black/[0.08] md:min-w-0 md:grid md:grid-cols-5">
          {items.map((item) => (
            <TrustCell key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
