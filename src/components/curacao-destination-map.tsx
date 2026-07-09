"use client";

import { motion } from "framer-motion";
import { Car } from "lucide-react";

import { useI18n } from "@/i18n/provider";
import { FLEET_IMAGES } from "@/lib/fleet-images";
import {
  MAP_COORDS,
  MAP_VIEWBOX,
  PIN_LABEL_OFFSET,
  ROUTE_DESTINATIONS,
  ROUTE_LABEL_T,
  getRouteTarget,
  pointOnRoute,
  routePath,
  type DestinationExperienceKey,
  type MapDestinationId,
  type MapPinKey,
} from "@/lib/destination-experience";

type CuracaoDestinationMapProps = {
  active: DestinationExperienceKey;
  driveMinutes: Record<MapDestinationId, string>;
};

function labelPillWidth(label: string) {
  return Math.max(label.length * 0.92, 6.5);
}

function PinNameChip({ label }: { label: string }) {
  const width = labelPillWidth(label);

  return (
    <>
      <rect
        x={-width / 2}
        y={-1.1}
        width={width}
        height={2.2}
        rx={1.1}
        fill="white"
        fillOpacity={0.94}
      />
      <text
        y={0.35}
        textAnchor="middle"
        className="fill-[var(--logo-black)] text-[1.05px] font-bold uppercase tracking-[0.03em]"
      >
        {label}
      </text>
    </>
  );
}

function DestinationPin({
  x,
  y,
  active,
  label,
  labelOffset,
}: {
  x: number;
  y: number;
  active: boolean;
  label: string;
  labelOffset: { x: number; y: number };
}) {
  return (
    <g transform={`translate(${x} ${y})`} aria-label={label}>
      {active ? (
        <motion.circle
          r={2.4}
          fill="var(--logo-red)"
          fillOpacity={0.18}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 360, damping: 24 }}
        />
      ) : null}
      <motion.g
        initial={false}
        animate={{ scale: active ? [1, 1.08, 1] : 1 }}
        transition={active ? { duration: 0.4, ease: "easeOut" } : { duration: 0.2 }}
      >
        <path
          d="M0 -1.5 C0.85 -1.5 1.5 -0.85 1.5 0 C1.5 1 0 2.6 0 2.6 C0 2.6 -1.5 1 -1.5 0 C-1.5 -0.85 -0.85 -1.5 0 -1.5 Z"
          fill={active ? "var(--logo-red)" : "#94a3b8"}
          stroke="white"
          strokeWidth="0.28"
        />
        <circle r={0.45} cy={-0.15} fill="white" />
      </motion.g>
      <g transform={`translate(${labelOffset.x} ${labelOffset.y})`}>
        <PinNameChip label={label} />
      </g>
    </g>
  );
}

function HatoMarker({
  x,
  y,
  label,
}: {
  x: number;
  y: number;
  label: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`} aria-label={label}>
      <circle r={2.1} fill="#111827" stroke="white" strokeWidth="0.35" />
      <text
        y={0.75}
        textAnchor="middle"
        fontSize="2.5"
        style={{ fontFamily: "system-ui, Apple Color Emoji, Segoe UI Emoji, sans-serif" }}
      >
        ✈️
      </text>
      <g transform={`translate(${PIN_LABEL_OFFSET.hato.x} ${PIN_LABEL_OFFSET.hato.y})`}>
        <PinNameChip label={label} />
      </g>
    </g>
  );
}

function TimeLabel({
  x,
  y,
  minutes,
  prominent,
}: {
  x: number;
  y: number;
  minutes: string;
  prominent: boolean;
}) {
  const text = `${minutes} min`;
  const width = text.length * 0.82 + 1.8;

  return (
    <g transform={`translate(${x} ${y})`} opacity={prominent ? 1 : 0.72}>
      <rect
        x={-width / 2}
        y={-1.15}
        width={width}
        height={2.3}
        rx={0.45}
        fill="var(--logo-red)"
      />
      <text
        y={0.42}
        textAnchor="middle"
        className="fill-white text-[1.25px] font-bold"
      >
        {text}
      </text>
    </g>
  );
}

export function CuracaoDestinationMap({
  active,
  driveMinutes,
}: CuracaoDestinationMapProps) {
  const { messages } = useI18n();
  const d = messages.destinations;
  const hato = MAP_COORDS.hato;
  const activeTarget = getRouteTarget(active);

  const pinLabels: Record<MapPinKey, string> = {
    hato: d.mapLabels.hato,
    janThiel: d.mapLabels.janThiel,
    westpunt: d.mapLabels.westpunt,
    willemstad: d.mapLabels.willemstad,
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-black/[0.06] bg-[#b8dce8] shadow-[0_12px_40px_rgb(0_0_0_0.08)]">
      <div className="relative aspect-[3/2] w-full">
        <svg
          viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={d.mapAriaLabel}
        >
          <image
            href={FLEET_IMAGES.curacaoSatelliteMap}
            x="0"
            y="0"
            width={MAP_VIEWBOX.width}
            height={MAP_VIEWBOX.height}
            preserveAspectRatio="xMidYMid meet"
          />
          <defs>
            <marker
              id="route-arrow"
              markerWidth="3"
              markerHeight="3"
              refX="2.4"
              refY="1.5"
              orient="auto"
            >
              <path d="M0,0 L3,1.5 L0,3 Z" fill="var(--logo-red)" />
            </marker>
            <marker
              id="route-arrow-muted"
              markerWidth="3"
              markerHeight="3"
              refX="2.4"
              refY="1.5"
              orient="auto"
            >
              <path d="M0,0 L3,1.5 L0,3 Z" fill="#cbd5e1" />
            </marker>
          </defs>

          {ROUTE_DESTINATIONS.map((dest) => {
            const to = MAP_COORDS[dest];
            const isActive = activeTarget === dest;
            const path = routePath(hato, to);

            return (
              <motion.path
                key={dest}
                d={path}
                fill="none"
                stroke={isActive ? "var(--logo-red)" : "#cbd5e1"}
                strokeWidth={isActive ? 0.38 : 0.28}
                strokeLinecap="round"
                strokeDasharray="1.1 0.85"
                markerEnd={isActive ? "url(#route-arrow)" : "url(#route-arrow-muted)"}
                initial={false}
                animate={{ opacity: isActive ? 1 : 0.55 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            );
          })}

          <HatoMarker x={hato.x} y={hato.y} label={pinLabels.hato} />

          {ROUTE_DESTINATIONS.map((pin) => (
            <DestinationPin
              key={pin}
              x={MAP_COORDS[pin].x}
              y={MAP_COORDS[pin].y}
              active={activeTarget === pin}
              label={pinLabels[pin]}
              labelOffset={PIN_LABEL_OFFSET[pin]}
            />
          ))}

          {ROUTE_DESTINATIONS.map((dest) => {
            const to = MAP_COORDS[dest];
            const isActive = activeTarget === dest;
            const labelPoint = pointOnRoute(hato, to, ROUTE_LABEL_T[dest]);

            return (
              <TimeLabel
                key={`time-${dest}`}
                x={labelPoint.x}
                y={labelPoint.y}
                minutes={driveMinutes[dest]}
                prominent={isActive}
              />
            );
          })}

          <text
            x={54}
            y={61}
            className="fill-[#5a9fb8] text-[3.5px] font-medium italic opacity-75"
          >
            {d.mapIslandLabel}
          </text>

          <g transform="translate(89 9)" opacity={0.4}>
            <circle r={3} fill="none" stroke="#64748b" strokeWidth="0.28" />
            <path d="M0 -2.4 L0 2.4 M-2.4 0 L2.4 0" stroke="#64748b" strokeWidth="0.28" />
            <polygon points="0,-2.1 -0.6,-0.6 0.6,-0.6" fill="#64748b" />
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/20 to-transparent pb-2.5 pt-8">
          <div className="mx-auto flex max-w-[92%] items-center justify-center gap-1.5 rounded-full bg-white/92 px-3 py-1.5 text-[9px] font-semibold text-black/70 shadow-sm backdrop-blur-sm sm:text-[10px]">
            <Car className="size-3 shrink-0 text-[var(--logo-red)]" />
            <span>{d.mapPerksTitle}</span>
            <span className="hidden text-black/35 sm:inline">·</span>
            <span className="hidden sm:inline">{d.mapPerksItems}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
