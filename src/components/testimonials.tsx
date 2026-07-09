"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { contactHrefs } from "@/lib/contact-links";
import { reviewKeys, type ReviewCopy } from "@/lib/reviews";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = ["#4285F4", "#DB4437", "#0F9D58", "#AB47BC", "#F4B400", "#00ACC1"] as const;

function avatarColor(name: string) {
  let hash = 0;
  for (const char of name) hash = char.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function ReviewCard({
  review,
  readMore,
  readLess,
  className,
}: {
  review: ReviewCopy;
  readMore: string;
  readLess: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.quote.length > 120;
  const initial = review.name.trim().charAt(0).toUpperCase();
  const color = avatarColor(review.name);

  return (
    <figure
      className={cn(
        "flex h-full flex-col rounded-lg border border-black/[0.08] bg-white px-6 py-7 text-center shadow-[0_4px_16px_rgb(0_0_0_0.04)]",
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-3 text-left">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <span
              className="grid size-11 place-items-center rounded-full text-lg font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {initial}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 grid size-[1.125rem] place-items-center rounded-full border-2 border-[#f3f3f3] bg-[#FBBC05] dark:border-muted/50">
              <Star className="size-2 fill-white text-white" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{review.name}</p>
            <p className="text-sm text-muted-foreground">{review.date}</p>
          </div>
        </div>
        <GoogleLogo className="size-5 shrink-0" />
      </div>

      <div className="mb-5 flex items-center justify-center gap-1.5">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="size-[1.125rem] fill-[#FBBC04] text-[#FBBC04]" />
          ))}
        </div>
        <span
          className="inline-grid size-5 place-items-center rounded-full bg-[#4285F4]"
          aria-label="Verified review"
        >
          <Check className="size-3 text-white" strokeWidth={3} />
        </span>
      </div>

      <blockquote
        className={cn(
          "text-sm leading-relaxed text-foreground",
          !expanded && isLong && "line-clamp-4",
        )}
      >
        {review.quote}
      </blockquote>

      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? readLess : readMore}
        </button>
      ) : null}
    </figure>
  );
}

export function Testimonials() {
  const { messages } = useI18n();
  const t = messages.testimonials;
  const reviews = reviewKeys.map((key) => t.reviews[key]);

  return (
    <section id="reviews" className="relative scroll-mt-28 bg-[#f7f7f7] px-5 py-14 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-16">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--logo-red)]">
              {t.eyebrow}
            </p>
            <h2 className="max-w-xl font-display text-3xl font-bold uppercase leading-[1.02] text-[var(--logo-black)] md:text-5xl">
              {t.titleLine1}
              <br />
              <span className="text-[var(--logo-red)]">{t.titleLine2}</span>
            </h2>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-5 fill-[#FBBC04] text-[#FBBC04]" />
                ))}
              </div>
              <span className="font-display text-xl font-bold text-[var(--logo-black)]">
                {t.ratingLabel} {t.ratingValue}
              </span>
              <span className="text-sm text-black/50">{t.ratingSource}</span>
            </div>
            <a
              href={contactHrefs.review}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--logo-red)] transition-colors hover:text-[#c92228]"
            >
              <GoogleLogo className="size-4" />
              {t.viewOnGoogle}
            </a>
          </div>
        </div>

        <div className="md:hidden">
          <Carousel opts={{ align: "start", containScroll: "trimSnaps", loop: false }}>
            <CarouselContent className="-ml-4">
              {reviews.map((review) => (
                <CarouselItem key={review.name} className="basis-[88%] pl-4 sm:basis-[75%]">
                  <ReviewCard review={review} readMore={t.readMore} readLess={t.readLess} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-5 flex justify-center gap-2">
              <CarouselPrevious
                className="static size-9 translate-x-0 translate-y-0"
                srLabel={messages.common.previousSlide}
              />
              <CarouselNext
                className="static size-9 translate-x-0 translate-y-0"
                srLabel={messages.common.nextSlide}
              />
            </div>
          </Carousel>
        </div>

        <div className="hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.name}
              review={review}
              readMore={t.readMore}
              readLess={t.readLess}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
