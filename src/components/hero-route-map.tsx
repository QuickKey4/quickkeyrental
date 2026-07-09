import { MapPin } from "lucide-react";

type HeroRouteMapProps = {
  labels: [string, string, string];
};

export function HeroRouteMap({ labels }: HeroRouteMapProps) {
  return (
    <div className="relative mx-auto mt-5 w-full max-w-[17rem] px-1 sm:mt-6 sm:max-w-xs md:max-w-sm">
      <svg
        viewBox="0 0 420 52"
        className="absolute inset-x-3 top-[0.4rem] h-5 text-[var(--cinema-accent)] sm:inset-x-4 sm:top-[0.45rem] sm:h-6"
        aria-hidden
      >
        <path
          d="M12 30 C 72 10, 132 42, 210 26 S 348 12, 408 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="5 6"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
      <div className="relative grid grid-cols-3 gap-1">
        {labels.map((label) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-[var(--cinema-accent)] shadow-[0_2px_8px_rgb(0_0_0_0.5)] sm:size-6">
              <MapPin className="size-2.5 fill-[var(--cinema-charcoal)] text-[var(--cinema-charcoal)] sm:size-3" />
            </span>
            <span className="text-[9px] font-semibold leading-tight text-white [text-shadow:0_1px_3px_rgb(0_0_0_0.85)] sm:text-[10px] md:text-xs">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
