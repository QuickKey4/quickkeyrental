/**
 * Fixed geographic coordinates — reference data only.
 * Pin placement on the satellite image uses MAP_COORDS below (hand-calibrated).
 */
export const CURACAO_MAP_LOCATIONS = {
  hato: {
    id: "hato",
    name: "Hato Airport",
    lat: 12.1889,
    lng: -68.9598,
  },
  willemstad: {
    id: "willemstad",
    name: "Willemstad",
    lat: 12.1084,
    lng: -68.9335,
  },
  janThiel: {
    id: "janThiel",
    name: "Jan Thiel Beach",
    lat: 12.0747,
    lng: -68.8703,
  },
  westpunt: {
    id: "westpunt",
    name: "Playa Kalki (Westpunt)",
    lat: 12.3755,
    lng: -69.1542,
  },
} as const;

export type CuracaoMapLocationId = keyof typeof CURACAO_MAP_LOCATIONS;

export type MapDestinationId = Exclude<CuracaoMapLocationId, "hato">;

export const MAP_VIEWBOX = { width: 100, height: 66.67 } as const;

/**
 * Hand-calibrated on `curacao-satellite-map.webp` (viewBox 0 0 100 66.67).
 * Pin anchors account for teardrop tip offset (~2.6 units below anchor).
 */
export const MAP_COORDS: Record<CuracaoMapLocationId, { x: number; y: number }> = {
  westpunt: { x: 9, y: 10 },
  hato: { x: 47.5, y: 33.1 },
  willemstad: { x: 51, y: 43.5 },
  janThiel: { x: 68.5, y: 48 },
};
