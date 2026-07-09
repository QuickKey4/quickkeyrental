import { defineEventHandler, readRawBody } from "h3";
import Stripe from "stripe";

import { getServerConfig } from "@/lib/config.server";

import { confirmBookingPayment } from "@/features/booking/api/booking-confirm.server";

export default defineEventHandler(async (event) => {
  const config = getServerConfig();
  if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
    return new Response("Stripe webhook not configured", { status: 503 });
  }

  const signature = event.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const rawBody = await readRawBody(event, false);
  if (!rawBody) {
    return new Response("Empty body", { status: 400 });
  }

  const stripe = new Stripe(config.stripeSecretKey);
  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripeWebhookSecret,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (bookingId) {
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : null;
      await confirmBookingPayment(bookingId, paymentIntentId);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
