import { getSupabaseAdminClient } from "@/lib/supabase/admin.server";

/** Server-side guard: car must be free for the requested inclusive period. */
export async function assertCarAvailableForPeriod(
  carId: string,
  pickupDate: string,
  returnDate: string,
  excludeBookingId?: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { data: hasConflict, error } = await supabase.rpc("car_has_booking_conflict", {
    p_car_id: carId,
    p_pickup: pickupDate,
    p_return: returnDate,
    p_exclude_booking_id: excludeBookingId ?? null,
  });

  if (error) throw new Error(error.message);

  if (hasConflict) {
    throw new Error("That car is no longer available for these dates.");
  }
}
