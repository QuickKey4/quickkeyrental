import { useMemo } from "react";

import { useFleetPricing } from "@/hooks/use-fleet-pricing";
import { useI18n } from "@/i18n/provider";
import { buildFleet, buildFleetFilters } from "@/lib/fleet";

export function useFleet() {
  const { locale, messages } = useI18n();
  const { data: pricing } = useFleetPricing();

  const fleet = useMemo(() => {
    const base = buildFleet(messages);
    if (!pricing) return base;
    return base.map((vehicle) => {
      const row = pricing[vehicle.key];
      if (!row) return vehicle;
      const onSale = row.effectivePrice < row.basePrice;
      return {
        ...vehicle,
        price: row.effectivePrice,
        regularPrice: onSale ? row.basePrice : undefined,
      };
    });
  }, [messages, pricing]);

  const fleetFilters = useMemo(() => buildFleetFilters(messages), [messages]);

  return { fleet, fleetFilters, locale };
}
