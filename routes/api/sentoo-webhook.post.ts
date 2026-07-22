import { defineEventHandler, readRawBody } from "h3";

import { confirmBookingSentooPayment } from "@/features/booking/api/booking-confirm.server";
import {
  getSentooTransactionStatus,
  isSentooConfigured,
} from "@/features/booking/api/sentoo.server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin.server";

function parseTransactionId(raw: string | null): string | null {
  if (!raw) return null;
  return raw.replace(/^"+|"+$/g, "").trim() || null;
}

export default defineEventHandler(async (event) => {
  if (!isSentooConfigured()) {
    return new Response("Sentoo webhook not configured", { status: 503 });
  }

  const rawBody = await readRawBody(event, false);
  if (!rawBody) {
    return new Response("success", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const bodyText = typeof rawBody === "string" ? rawBody : new TextDecoder().decode(rawBody);
  const params = new URLSearchParams(bodyText);
  const transactionId = parseTransactionId(params.get("transaction_id"));

  if (!transactionId) {
    return new Response("success", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data: bookingId, error: lookupError } = await supabase.rpc(
      "get_booking_id_by_sentoo_transaction",
      { p_transaction_id: transactionId },
    );

    if (lookupError) {
      console.error("Sentoo webhook lookup failed:", lookupError.message);
      return new Response("success", {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    if (!bookingId) {
      return new Response("success", {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    const statusResult = await getSentooTransactionStatus(transactionId);

    await supabase.rpc("update_booking_sentoo_status", {
      p_booking_id: bookingId,
      p_status: statusResult.status,
    });

    if (statusResult.status === "success") {
      await confirmBookingSentooPayment(String(bookingId), transactionId);
    }
  } catch (error) {
    console.error("Sentoo webhook processing error:", error);
    return new Response("retry", { status: 500 });
  }

  return new Response("success", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
});
