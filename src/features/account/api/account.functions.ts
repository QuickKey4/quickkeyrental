import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase/admin.server";

export type EmailLoginStatus = "existing_account" | "bookings_only" | "not_found";

export type EmailLoginLookup = {
  status: EmailLoginStatus;
  bookingCount: number;
};

export const lookupEmailForLogin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email() }))
  .handler(async ({ data }): Promise<EmailLoginLookup> => {
    const supabase = getSupabaseAdminClient();
    const { data: result, error } = await supabase.rpc("lookup_email_for_login", {
      p_email: data.email.trim(),
    });

    if (error) throw new Error(error.message);

    const payload = result as { status?: string; booking_count?: number } | null;
    const status = payload?.status as EmailLoginStatus | undefined;

    if (status === "existing_account" || status === "bookings_only" || status === "not_found") {
      return {
        status,
        bookingCount: Number(payload?.booking_count ?? 0),
      };
    }

    return { status: "not_found", bookingCount: 0 };
  });
