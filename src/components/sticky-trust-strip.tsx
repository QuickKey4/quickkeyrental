import { Heart, Plane, ShieldCheck, Truck } from "lucide-react";

import { useI18n } from "@/i18n/provider";

export function StickyTrustStrip() {
  const { messages } = useI18n();
  const t = messages.stickyTrust;

  const items = [
    { icon: ShieldCheck, label: t.insurance },
    { icon: Plane, label: t.airport },
    { icon: Truck, label: t.hotel },
    { icon: Heart, label: t.visitors },
  ] as const;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-[var(--logo-black)] text-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-7xl overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max flex-1 items-stretch divide-x divide-white/10">
          {items.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex flex-1 items-center justify-center gap-2 px-3 py-2.5 sm:gap-2.5 sm:px-4 sm:py-3"
            >
              <Icon className="size-3.5 shrink-0 text-[var(--logo-red)] sm:size-4" strokeWidth={2} />
              <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.08em] text-white/90 sm:text-[11px] sm:tracking-[0.1em]">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Space for sticky strip + contact FAB on small screens. */
export const STICKY_TRUST_OFFSET_CLASS = "pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] md:pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]";

/** Fixed sidebars: bottom edge aligns with the top of the sticky strip. */
export const SIDEBAR_BOTTOM_OFFSET =
  "bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))] md:bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]";
