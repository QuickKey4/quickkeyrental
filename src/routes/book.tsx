import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getBookingAccess } from "@/features/booking/api/booking.functions";
import { BookingFlow } from "@/features/booking/BookingFlow";
import type { BookingStep } from "@/features/booking/bookingTypes";
import { useBookingCopy } from "@/features/booking/useBookingCopy";
import { useI18n } from "@/i18n/provider";
import { getMessages } from "@/i18n/messages";
import { contactHrefs } from "@/lib/contact-links";

type Search = {
  car?: string;
  delivery?: string;
  from?: string;
  to?: string;
  step?: BookingStep;
  bookingId?: string;
  attempt?: string;
  code?: string;
};

const BOOKING_STEPS: BookingStep[] = [
  "dates",
  "cars",
  "customer",
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
    code: typeof search.code === "string" ? search.code : undefined,
  }),
  loaderDeps: ({ search: { code, step, bookingId } }) => ({ code, step, bookingId }),
  loader: ({ deps }) =>
    getBookingAccess({
      data: { code: deps.code, step: deps.step, bookingId: deps.bookingId },
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
  const access = Route.useLoaderData();
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

          {access.allowed ? (
            <BookingFlow
              initialStep={search.step ?? "dates"}
              initialBookingId={search.bookingId}
              initialAttempt={search.attempt}
              bookingTestCode={search.code}
              searchParams={{
                car: search.car,
                delivery: search.delivery,
                from: search.from,
                to: search.to,
              }}
            />
          ) : (
            <BookingUnavailable />
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function BookingUnavailable() {
  const { messages } = useI18n();
  const copy = messages.bookingUnavailable;
  const whatsappHref = `${contactHrefs.whatsapp}?text=${encodeURIComponent(copy.whatsappMessage)}`;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[rgba(237,28,36,0.16)] bg-[#fbfaf8] shadow-[0_24px_70px_rgba(16,16,16,0.08)]">
      <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
        <div className="px-6 py-10 md:px-10 md:py-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--logo-red)]">
            {copy.eyebrow}
          </p>
          <h2 className="max-w-2xl font-display text-3xl font-bold uppercase leading-tight text-[var(--logo-black)] md:text-5xl">
            {copy.title}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {copy.body}
          </p>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {copy.urgent}
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--logo-red)] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_16px_35px_rgba(237,28,36,0.24)] transition hover:-translate-y-0.5 hover:bg-[#c9161d] focus:outline-none focus:ring-2 focus:ring-[var(--logo-red)] focus:ring-offset-2"
          >
            <MessageCircle className="size-4" />
            {copy.cta}
          </a>
        </div>
        <div className="flex min-h-52 items-center justify-center bg-[var(--logo-black)] px-6 py-10 text-center text-white md:min-h-full">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/55">
              {copy.pauseLabel}
            </p>
            <p className="mt-4 font-display text-2xl font-bold uppercase leading-tight md:text-4xl">
              {copy.directHelp}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
