"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Car, KeyRound, MapPin } from "lucide-react";

import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const stepIcons = [KeyRound, Car, MapPin] as const;
const stepKeys = ["book", "pickup", "explore"] as const;

export function HowItWorks() {
  const { messages } = useI18n();
  const h = messages.howItWorks;
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7f7f7_48%,#ffffff_100%)] px-5 py-14 md:px-8 md:py-20"
    >
      <div
        className="pointer-events-none absolute -left-24 top-16 size-64 rounded-full bg-[var(--logo-red)]/[0.04] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-8 size-72 rounded-full bg-[#7eb9dc]/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl">
        <div
          className={cn(
            "mb-10 text-center md:mb-14 motion-safe:transition-all motion-safe:duration-700",
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--logo-red)]">
            {h.eyebrow}
          </p>
          <h2 className="font-display text-3xl font-bold uppercase leading-[1.02] text-[var(--logo-black)] md:text-5xl">
            {h.titleLine1} {h.titleLine2}{" "}
            <span className="text-[var(--logo-red)]">{h.titleLine3}</span>
          </h2>
        </div>

        <ol className="relative grid gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch md:gap-0">
          {stepKeys.flatMap((key, index) => {
            const step = h.steps[key];
            const Icon = stepIcons[index];
            const stepNumber = String(index + 1).padStart(2, "0");

            const card = (
                <li
                  key={key}
                  className={cn(
                    "group relative overflow-hidden rounded-lg border border-black/[0.08] bg-white p-6 text-center shadow-[0_4px_16px_rgb(0_0_0_0.04)] motion-safe:transition-all motion-safe:duration-500 md:p-8",
                    "hover:-translate-y-1 hover:border-[var(--logo-red)]/25 hover:shadow-[0_14px_32px_rgb(232_40_46_0.12)]",
                    visible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-8 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
                  )}
                  style={
                    visible
                      ? { transitionDelay: `${180 + index * 140}ms` }
                      : undefined
                  }
                >
                  <span
                    className="pointer-events-none absolute -right-2 -top-3 font-display text-[5.5rem] font-bold leading-none text-[var(--logo-red)]/[0.07] transition-colors duration-500 group-hover:text-[var(--logo-red)]/[0.12] md:text-[6.5rem]"
                    aria-hidden
                  >
                    {stepNumber}
                  </span>

                  <span className="relative mx-auto mb-4 inline-grid size-12 place-items-center rounded-full bg-[var(--logo-red)] text-white shadow-[0_8px_20px_rgb(232_40_46_0.28)] motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-110">
                    <Icon className="size-5" strokeWidth={2} />
                  </span>

                  <h3 className="relative font-display text-lg font-bold uppercase tracking-[0.02em] text-[var(--logo-black)]">
                    {step.title}
                  </h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-black/60">{step.body}</p>

                  <span
                    className="absolute bottom-0 left-0 h-0.5 w-0 bg-[var(--logo-red)] motion-safe:transition-all motion-safe:duration-500 group-hover:w-full"
                    aria-hidden
                  />
                </li>
            );

            if (index >= stepKeys.length - 1) return [card];

            return [
              card,
              <li
                key={`${key}-connector`}
                className="hidden list-none items-center justify-center px-3 md:flex"
                aria-hidden
              >
                <span
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[var(--logo-red)] shadow-sm motion-safe:transition-all motion-safe:duration-500",
                    visible ? "scale-100 opacity-100" : "scale-75 opacity-0 motion-reduce:scale-100 motion-reduce:opacity-100",
                  )}
                  style={
                    visible ? { transitionDelay: `${260 + index * 140}ms` } : undefined
                  }
                >
                  <ArrowRight className="size-4" strokeWidth={2.5} />
                </span>
              </li>,
            ];
          })}
        </ol>
      </div>
    </section>
  );
}
