import process from "node:process";

import { SITE_URL } from "./site-metadata";

// Server-only config. The .server.ts suffix prevents Vite from bundling
// this file into the client — values here never reach the browser.
//
// On Cloudflare Workers, env binds at REQUEST time. Module-scope reads
// (e.g. `const x = process.env.X`) resolve to undefined — always read
// process.env INSIDE a function or handler.
//
// When to use which env-access pattern:
//   - .server.ts module (this file): server-only helpers reused across
//     handlers. Wrap reads in a function so they run per-request.
//   - inline process.env inside a createServerFn handler: one-off reads
//     not reused elsewhere.
//   - import.meta.env.VITE_FOO: PUBLIC config readable from both client
//     and server (analytics IDs, public URLs). Define in .env with the
//     VITE_ prefix. Never put secrets here — they ship to the browser.

function resolveSiteUrl(): string {
  const configured = process.env.VITE_SITE_URL?.trim().replace(/\/$/, "");
  if (configured && configured.startsWith("https://") && !configured.includes("localhost")) {
    return configured;
  }

  if (process.env.VERCEL_ENV === "production") {
    return SITE_URL;
  }

  return configured || "http://localhost:3000";
}

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    sentooApiHost: process.env.SENTOO_API_HOST,
    sentooMerchantId: process.env.SENTOO_MERCHANT_ID,
    sentooMerchantSecret: process.env.SENTOO_MERCHANT_SECRET,
    sentooCurrency: process.env.SENTOO_CURRENCY ?? "USD",
    siteUrl: resolveSiteUrl(),
  };
}
