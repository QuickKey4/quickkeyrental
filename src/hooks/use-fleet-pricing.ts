import { useQuery } from "@tanstack/react-query";

import { getPublicFleetPricing } from "@/features/pricing/fleet-pricing.functions";

export type FleetPricingMap = Record<
  string,
  {
    basePrice: number;
    effectivePrice: number;
    discountId: string | null;
    discountLabel: string | null;
  }
>;

export function useFleetPricing() {
  return useQuery({
    queryKey: ["fleet-pricing"],
    queryFn: () => getPublicFleetPricing(),
    staleTime: 60_000,
  });
}
