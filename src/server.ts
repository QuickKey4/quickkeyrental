import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleMaintenanceRequest } from "./lib/maintenance.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function handleEmailSmokeTestRequest(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ ok: false, error: "Method not allowed." }, { status: 405 });
  }

  const providedSecret =
    request.headers.get("x-quickkey-admin-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";

  try {
    const [{ assertAdminSecret }, { BRAND }, { sendLoggedTemplateEmail }] = await Promise.all([
      import("./features/admin/api/admin-auth.server"),
      import("./lib/brand"),
      import("./lib/email.server"),
    ]);

    assertAdminSecret(providedSecret);

    const recipient = process.env.BOOKING_NOTIFICATION_EMAIL;
    if (!recipient) {
      return Response.json(
        { ok: false, error: "BOOKING_NOTIFICATION_EMAIL is not configured." },
        { status: 503 },
      );
    }

    const result = await sendLoggedTemplateEmail({
      templateKey: "email_smoke_test",
      locale: "en",
      to: recipient,
      idempotencyKey: "smoke:email-production-readiness:2026-07-13",
      input: {
        adminUrl: `${BRAND.website}/admin`,
        ctaHref: `${BRAND.website}/admin`,
        ctaLabel: "Open admin",
      },
    });

    return Response.json({
      ok: true,
      status: result.status,
      recipientEnv: "BOOKING_NOTIFICATION_EMAIL",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email smoke test failed.";
    const status = message.includes("Invalid admin password") ? 401 : 500;
    return Response.json({ ok: false, error: message }, { status });
  }
}

function sentooWebhookSuccess(): Response {
  return new Response("success", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function parseSentooTransactionId(raw: string | null): string | null {
  if (!raw) return null;
  return raw.replace(/^"+|"+$/g, "").trim() || null;
}

async function handleSentooWebhookRequest(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return sentooWebhookSuccess();
  }

  const [{ getSupabaseAdminClient }, sentoo, bookingConfirm] = await Promise.all([
    import("./lib/supabase/admin.server"),
    import("./features/booking/api/sentoo.server"),
    import("./features/booking/api/booking-confirm.server"),
  ]);

  if (!sentoo.isSentooConfigured()) {
    return new Response("Sentoo webhook not configured", { status: 503 });
  }

  const bodyText = await request.text();
  if (!bodyText) {
    return sentooWebhookSuccess();
  }

  const params = new URLSearchParams(bodyText);
  const transactionId = parseSentooTransactionId(params.get("transaction_id"));
  if (!transactionId) {
    return sentooWebhookSuccess();
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data: bookingId, error: lookupError } = await supabase.rpc(
      "get_booking_id_by_sentoo_transaction",
      { p_transaction_id: transactionId },
    );

    if (lookupError) {
      console.error("Sentoo webhook lookup failed:", lookupError.message);
      return sentooWebhookSuccess();
    }

    if (!bookingId) {
      return sentooWebhookSuccess();
    }

    const statusResult = await sentoo.getSettledSentooTransactionStatus(transactionId);

    await supabase.rpc("update_booking_sentoo_status", {
      p_booking_id: bookingId,
      p_status: statusResult.status,
    });

    if (statusResult.status === "success") {
      await bookingConfirm.confirmBookingSentooPayment(String(bookingId), transactionId);
    }
  } catch (error) {
    console.error("Sentoo webhook processing error:", error);
    return new Response("retry", { status: 500 });
  }

  return sentooWebhookSuccess();
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(
  request: Request,
  response: Response,
): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(request.headers.get("accept-language")), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/maintenance/run") {
        return handleMaintenanceRequest(request);
      }
      if (url.pathname === "/api/admin/email-smoke-test") {
        return handleEmailSmokeTestRequest(request);
      }
      if (url.pathname === "/api/sentoo-webhook") {
        return handleSentooWebhookRequest(request);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(request, response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(request.headers.get("accept-language")), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
