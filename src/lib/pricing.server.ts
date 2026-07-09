import { getSupabaseAdminClient } from "@/lib/supabase/admin.server";

export type DiscountScope = "all" | "compact" | "sedan" | "car";
export type DiscountType = "percent" | "fixed_amount";

export type EffectiveDailyPrice = {
  basePrice: number;
  effectivePrice: number;
  discountId: string | null;
  discountLabel: string | null;
};

export type FleetPricingRow = {
  carId: string;
  fleetKey: string;
  basePrice: number;
  effectivePrice: number;
  discountId: string | null;
  discountLabel: string | null;
};

export type PricingDiscountRow = {
  id: string;
  name: string;
  discount_type: DiscountType;
  discount_value: number;
  scope: DiscountScope;
  car_id: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export async function resolveEffectiveDailyPrice(
  carId: string,
  at?: Date,
): Promise<EffectiveDailyPrice | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("resolve_effective_daily_price", {
    p_car_id: carId,
    p_at: (at ?? new Date()).toISOString(),
  });

  if (error) throw new Error(error.message);
  const row = data?.[0];
  if (!row) return null;

  return {
    basePrice: Number(row.base_price),
    effectivePrice: Number(row.effective_price),
    discountId: row.discount_id ?? null,
    discountLabel: row.discount_label ?? null,
  };
}

export async function getFleetPricingNow(): Promise<FleetPricingRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data: cars, error } = await supabase
    .from("cars")
    .select("id, image_url, daily_price")
    .eq("is_active", true)
    .order("created_at");

  if (error) throw new Error(error.message);

  const rows: FleetPricingRow[] = [];
  for (const car of cars ?? []) {
    const pricing = await resolveEffectiveDailyPrice(car.id);
    if (!pricing) continue;
    rows.push({
      carId: car.id,
      fleetKey: car.image_url ?? "",
      basePrice: pricing.basePrice,
      effectivePrice: pricing.effectivePrice,
      discountId: pricing.discountId,
      discountLabel: pricing.discountLabel,
    });
  }
  return rows;
}

export function formatDiscountSummary(
  discount: Pick<PricingDiscountRow, "discount_type" | "discount_value" | "scope">,
): string {
  const amount =
    discount.discount_type === "percent"
      ? `${discount.discount_value}% off`
      : `$${discount.discount_value}/day off`;
  const scopeLabel =
    discount.scope === "all"
      ? "All vehicles"
      : discount.scope === "compact"
        ? "Compact"
        : discount.scope === "sedan"
          ? "Sedan"
          : "Vehicle";
  return `${amount} · ${scopeLabel}`;
}
