import { FLEET_IMAGES } from "@/lib/fleet-images";
import type { Messages } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/config";
import { interpolate } from "@/i18n/interpolate";

export type VehicleFilterKey = "agya" | "yaris";

export type VehicleKey = "agya-1" | "agya-2" | "yaris-1";

export type VehicleFilter = "all" | VehicleFilterKey;

export type VehicleBadge = {
  label: string;
  tone: "premium" | "limited" | "available";
};

export type Vehicle = {
  key: VehicleKey;
  filterKey: VehicleFilterKey;
  name: string;
  category: string;
  filterLabel: string;
  price: number;
  /** Base rate before an active discount (for strikethrough UI). */
  regularPrice?: number;
  image: string;
  detailImage: string;
  /** Vertical focal point for card/detail photos (object-position). */
  imageObjectPosition?: string;
  seats: number;
  fuel: string;
  transmission: string;
  description: string;
  badge?: VehicleBadge;
  detail: VehicleDetail;
};

export type VehicleDetail = {
  year: number;
  doors: number;
  bodyType: string;
  engine: string;
  luggage: string;
  color: string;
  mileage: string;
  minAge: string;
  license: string;
  highlights: string[];
  idealFor: string[];
};

const fleetAssets = [
  {
    key: "agya-1" as const,
    filterKey: "agya" as const,
    copyKey: "agya" as const,
    unitLabelKey: "unitOne" as const,
    price: 55,
    image: FLEET_IMAGES.agyaAirportCurThumb,
    detailImage: FLEET_IMAGES.agyaAirportCur,
    seats: 5,
    doors: 4,
    year: 2026,
    badge: { tone: "premium" as const, badgeKey: "mostPopular" as const },
  },
  {
    key: "agya-2" as const,
    filterKey: "agya" as const,
    copyKey: "agya" as const,
    unitLabelKey: "unitTwo" as const,
    price: 55,
    image: FLEET_IMAGES.agyaCuracaoSignThumb,
    detailImage: FLEET_IMAGES.agyaCuracaoSign,
    imageObjectPosition: "center 38%",
    seats: 5,
    doors: 4,
    year: 2026,
  },
  {
    key: "yaris-1" as const,
    filterKey: "yaris" as const,
    copyKey: "yaris" as const,
    price: 65,
    image: FLEET_IMAGES.yarisAirportCurThumb,
    detailImage: FLEET_IMAGES.yarisAirportCur,
    seats: 5,
    doors: 5,
    year: 2025,
    badge: { tone: "premium" as const, badgeKey: "guestFavorite" as const },
  },
];

export function buildFleet(messages: Messages): Vehicle[] {
  return fleetAssets.map((asset) => {
    const copy = messages.fleet.vehicles[asset.copyKey];
    const badgeLabel = asset.badge
      ? messages.fleet.badges[asset.badge.badgeKey as keyof typeof messages.fleet.badges]
      : undefined;
    const unitLabel =
      "unitLabelKey" in asset
        ? messages.fleet.units[asset.unitLabelKey as keyof typeof messages.fleet.units]
        : undefined;

    return {
      key: asset.key,
      filterKey: asset.filterKey,
      price: asset.price,
      image: asset.image,
      detailImage: asset.detailImage,
      imageObjectPosition:
        "imageObjectPosition" in asset ? asset.imageObjectPosition : undefined,
      seats: asset.seats,
      name: copy.name,
      category: unitLabel
        ? interpolate(copy.categoryWithUnit, { unit: unitLabel })
        : copy.category,
      filterLabel: messages.fleet.filters[asset.filterKey],
      fuel: copy.fuel,
      transmission: copy.transmission,
      description: copy.description,
      badge: asset.badge && badgeLabel ? { label: badgeLabel, tone: asset.badge.tone } : undefined,
      detail: {
        year: asset.year,
        doors: asset.doors,
        bodyType: copy.detail.bodyType,
        engine: copy.detail.engine,
        luggage: copy.detail.luggage,
        color: copy.detail.color,
        mileage: copy.detail.mileage,
        minAge: copy.detail.minAge,
        license: copy.detail.license,
        highlights: [...copy.detail.highlights],
        idealFor: [...copy.detail.idealFor],
      },
    };
  });
}

export function buildFleetFilters(messages: Messages): { id: VehicleFilter; label: string }[] {
  return [
    { id: "all", label: messages.fleet.filters.all },
    { id: "agya", label: messages.fleet.filters.agya },
    { id: "yaris", label: messages.fleet.filters.yaris },
  ];
}

let fleetCache: { locale: SupportedLocale; fleet: Vehicle[] } | null = null;

export function getFleetForLocale(locale: SupportedLocale, messages: Messages): Vehicle[] {
  if (fleetCache?.locale === locale) return fleetCache.fleet;
  const fleet = buildFleet(messages);
  fleetCache = { locale, fleet };
  return fleet;
}

export const fleetByKeyFrom = (fleet: Vehicle[]) =>
  Object.fromEntries(fleet.map((vehicle) => [vehicle.key, vehicle])) as Record<VehicleKey, Vehicle>;

export function getVehicle(fleet: Vehicle[], key?: string): Vehicle {
  const map = fleetByKeyFrom(fleet);
  if (key && key in map) {
    return map[key as VehicleKey];
  }
  return map["agya-1"];
}

export function filterFleet(fleet: Vehicle[], filter: VehicleFilter): Vehicle[] {
  if (filter === "all") return fleet;
  return fleet.filter((vehicle) => vehicle.filterKey === filter);
}

export const badgeToneClass: Record<VehicleBadge["tone"], string> = {
  premium: "bg-primary text-primary-foreground",
  limited: "bg-warning/20 text-warning border border-warning/30",
  available: "bg-success/15 text-success border border-success/30",
};
