import { createFileRoute } from "@tanstack/react-router";

import { Hero } from "@/components/hero";
import { LazySection } from "@/components/lazy-section";
import { SectionSkeleton } from "@/components/section-skeleton";
import { SiteFooter } from "@/components/site-footer";
import { HERO_LCP_IMAGE, HERO_PANORAMA } from "@/lib/fleet-images";
import { getMessages } from "@/i18n/messages";
import { SITE_METADATA } from "@/lib/site-metadata";

export const Route = createFileRoute("/")({
  head: ({ match }) => {
    const locale = match.context.locale;
    const messages = getMessages(locale);

    return {
      meta: [
        { title: messages.meta.siteTitle },
        { name: "description", content: messages.meta.siteDescription },
        { property: "og:title", content: messages.meta.ogTitle },
        { property: "og:description", content: messages.meta.ogDescription },
        { property: "og:url", content: SITE_METADATA.url },
        { property: "og:image", content: SITE_METADATA.ogImage },
      ],
      links: [
        {
          rel: "preload",
          as: "image",
          href: HERO_LCP_IMAGE,
          imageSrcSet: HERO_PANORAMA.srcSet,
          imageSizes: "100vw",
          fetchPriority: "high",
        },
      ],
    };
  },
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen bg-white">
      <Hero />

      <LazySection
        sectionId="fleet"
        load={() => import("@/components/featured-fleet").then((m) => ({ default: m.FeaturedFleet }))}
        fallback={<SectionSkeleton className="h-[28rem] bg-white md:h-[32rem]" />}
      />

      <LazySection
        load={() => import("@/components/how-it-works").then((m) => ({ default: m.HowItWorks }))}
        fallback={<SectionSkeleton className="h-80 bg-white md:h-96" />}
      />

      <LazySection
        sectionId="about"
        load={() => import("@/components/meet-owner").then((m) => ({ default: m.MeetOwner }))}
        fallback={<SectionSkeleton className="h-[32rem] bg-white md:h-[36rem]" />}
      />

      <LazySection
        load={() => import("@/components/why-choose").then((m) => ({ default: m.WhyChoose }))}
        fallback={<SectionSkeleton className="h-[36rem] bg-[#f7f7f7] md:h-[40rem]" />}
      />

      <LazySection
        sectionId="destinations"
        load={() =>
          import("@/components/destinations-section").then((m) => ({ default: m.DestinationsSection }))
        }
        fallback={<SectionSkeleton className="h-[36rem] bg-[#f7f7f7] md:h-[40rem]" />}
      />

      <LazySection
        load={() => import("@/components/testimonials").then((m) => ({ default: m.Testimonials }))}
        fallback={<SectionSkeleton className="h-[28rem] bg-[#f7f7f7] md:h-[32rem]" />}
      />

      <LazySection
        load={() => import("@/components/faq-section").then((m) => ({ default: m.FaqSection }))}
        fallback={<SectionSkeleton className="h-96 bg-white md:h-[28rem]" />}
      />

      <LazySection
        load={() => import("@/components/cta-banner").then((m) => ({ default: m.CtaBanner }))}
        fallback={<SectionSkeleton className="h-72 bg-white md:h-80" />}
      />

      <SiteFooter />
    </main>
  );
}
