import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase/admin.server";

import { sendBookingCancellationEmails } from "./cancellation.server";

export const sendBookingCancellationEmailsFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ bookingId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseAdminClient();
    const { data: bookingJson, error } = await supabase.rpc("get_booking_by_id", {
      p_booking_id: data.bookingId,
    });

    if (error) throw new Error(error.message);

    const booking = bookingJson as Parameters<typeof sendBookingCancellationEmails>[0];
    if (!booking?.id) throw new Error("Booking not found.");

    await sendBookingCancellationEmails(booking);
    return { ok: true as const };
  });
