import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BookingFlow } from "@/features/booking/BookingFlow";
import type { BookingStep } from "@/features/booking/bookingTypes";
import { useBookingCopy } from "@/features/booking/useBookingCopy";
import { getMessages } from "@/i18n/messages";

type Search = {
  car?: string;
  delivery?: string;
  from?: string;
  to?: string;
  step?: BookingStep;
  bookingId?: string;
  attempt?: string;
};

const BOOKING_STEPS: BookingStep[] = [
  "dates",
  "cars",
  "customer",
  "driver",
  "extras",
  "review",
  "payment",
  "confirmation",
];

export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    car: typeof search.car === "string" ? search.car : undefined,
    delivery: typeof search.delivery === "string" ? search.delivery : undefined,
    from: typeof search.from === "string" ? search.from : undefined,
    to: typeof search.to === "string" ? search.to : undefined,
    step:
      typeof search.step === "string" && BOOKING_STEPS.includes(search.step as BookingStep)
        ? (search.step as BookingStep)
        : undefined,
    bookingId: typeof search.bookingId === "string" ? search.bookingId : undefined,
    attempt: typeof search.attempt === "string" ? search.attempt : undefined,
  }),
  head: ({ match }) => {
    const locale = match.context.locale;
    const messages = getMessages(locale);

    return {
      meta: [
        { title: messages.meta.bookTitle },
        { name: "description", content: messages.meta.bookDescription },
      ],
    };
  },
  component: BookPage,
});

function BookPage() {
  const search = Route.useSearch();
  const copy = useBookingCopy();

  return (
    <main className="relative min-h-screen bg-white">
      <SiteHeader appearance="brand" />
      <section className="px-5 pb-20 pt-28 md:px-8">
        <div className="mx-auto max-w-5xl">
          {search.step !== "confirmation" ? (
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> {copy.backHome}
            </Link>
          ) : null}

          <div className="mb-10">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--logo-red)]">
              {copy.reservation}
            </p>
            <h1 className="font-display text-3xl font-bold uppercase text-[var(--logo-black)] md:text-5xl">
              {copy.title}
            </h1>
          </div>

          <BookingFlow
            initialStep={search.step ?? "dates"}
            initialBookingId={search.bookingId}
            initialAttempt={search.attempt}
            searchParams={{
              car: search.car,
              delivery: search.delivery,
              from: search.from,
              to: search.to,
            }}
          />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
