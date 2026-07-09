import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase/admin.server";

import { fleetKeyFromCar, sortCarsByFleetOrder } from "../bookingUtils";
import type { CarAvailability } from "../bookingTypes";

const availabilityInput = z.object({
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type AvailabilityRow = {
  id: string;
  name: string;
  category: string;
  year: number;
  daily_price: number;
  base_daily_price: number;
  discount_id: string | null;
  discount_label: string | null;
  seats: number;
  bags: number;
  transmission: string;
  fuel_type: string;
  ac: boolean;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  available: boolean;
  blocked_through_date: string | null;
  next_available_date: string | null;
};

export const getCarAvailability = createServerFn({ method: "POST" })
  .inputValidator(availabilityInput)
  .handler(async ({ data }): Promise<CarAvailability[]> => {
    const supabase = getSupabaseAdminClient();

    const { data: rows, error } = await supabase.rpc("get_car_availability", {
      p_pickup: data.pickupDate,
      p_return: data.returnDate,
    });

    if (error) throw new Error(error.message);

    const result = ((rows as AvailabilityRow[] | null) ?? []).map((row) => ({
      car: {
        id: row.id,
        name: row.name,
        category: row.category,
        year: row.year,
        daily_price: Number(row.daily_price),
        seats: row.seats,
        bags: row.bags,
        transmission: row.transmission,
        fuel_type: row.fuel_type,
        ac: row.ac,
        image_url: row.image_url,
        is_active: row.is_active,
        created_at: row.created_at,
      },
      fleetKey: fleetKeyFromCar({
        id: row.id,
        name: row.name,
        category: row.category,
        year: row.year,
        daily_price: Number(row.daily_price),
        seats: row.seats,
        bags: row.bags,
        transmission: row.transmission,
        fuel_type: row.fuel_type,
        ac: row.ac,
        image_url: row.image_url,
        is_active: row.is_active,
        created_at: row.created_at,
      }),
      available: row.available,
      blockedThroughDate: row.blocked_through_date,
      nextAvailableDate: row.next_available_date,
      baseDailyPrice: Number(row.base_daily_price ?? row.daily_price),
      discountId: row.discount_id,
      discountLabel: row.discount_label,
    }));

    return sortCarsByFleetOrder(result);
  });

export const getBookingExtras = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("extras")
    .select("*")
    .eq("is_active", true)
    .order("price_per_day", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
});
