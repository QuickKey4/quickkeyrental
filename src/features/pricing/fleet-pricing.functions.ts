import { createServerFn } from "@tanstack/react-start";

import { getFleetPricingNow } from "@/lib/pricing.server";

export const getPublicFleetPricing = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await getFleetPricingNow();
  return Object.fromEntries(
    rows.map((row) => [
      row.fleetKey,
      {
        basePrice: row.basePrice,
        effectivePrice: row.effectivePrice,
        discountId: row.discountId,
        discountLabel: row.discountLabel,
      },
    ]),
  );
});
