import type { VehicleKey } from "@/lib/fleet";
import { FLEET_IMAGES } from "@/lib/fleet-images";
import {
  MAP_COORDS,
  MAP_VIEWBOX,
  type CuracaoMapLocationId,
  type MapDestinationId,
} from "@/lib/curacao-map-locations";

export const destinationExperienceKeys = [
  "westpunt",
  "janThiel",
  "willemstad",
] as const;

export type DestinationExperienceKey = (typeof destinationExperienceKeys)[number];

export type MapPinKey = CuracaoMapLocationId;

export const DESTINATION_IMAGES: Record<DestinationExperienceKey, string> = {
  westpunt: FLEET_IMAGES.destinationWestpunt,
  janThiel: FLEET_IMAGES.destinationJanThiel,
  willemstad: FLEET_IMAGES.destinationWillemstad,
};

export const DESTINATION_THUMB_IMAGES: Record<DestinationExperienceKey, string> = {
  westpunt: FLEET_IMAGES.destinationWestpuntThumb,
  janThiel: FLEET_IMAGES.destinationJanThielThumb,
  willemstad: FLEET_IMAGES.destinationWillemstadThumb,
};

export { MAP_COORDS, MAP_VIEWBOX };

/** Pin name label offset from anchor (negative y = above pin). */
export const PIN_LABEL_OFFSET: Record<MapPinKey, { x: number; y: number }> = {
  hato: { x: 0, y: -3.4 },
  westpunt: { x: 0, y: 4.2 },
  willemstad: { x: 0, y: 4.2 },
  janThiel: { x: 0, y: 4.2 },
};

export const ROUTE_DESTINATIONS: MapDestinationId[] = [
  "westpunt",
  "willemstad",
  "janThiel",
];

/** Position along route curve for the minutes label (0–1). */
export const ROUTE_LABEL_T: Record<MapDestinationId, number> = {
  westpunt: 0.48,
  willemstad: 0.78,
  janThiel: 0.5,
};

export const RECOMMENDED_VEHICLE: Record<
  DestinationExperienceKey,
  VehicleKey
> = {
  janThiel: "agya-1",
  westpunt: "yaris-1",
  willemstad: "yaris-1",
};

export function getRouteTarget(key: DestinationExperienceKey): MapDestinationId {
  return key;
}

function curveControl(
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y) - 3.5;
  return { x: midX, y: midY };
}

export function routePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const control = curveControl(from, to);
  return `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`;
}

export function pointOnRoute(
  from: { x: number; y: number },
  to: { x: number; y: number },
  t: number,
) {
  const control = curveControl(from, to);
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
  };
}

export type { CuracaoMapLocationId, MapDestinationId };
