import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { BRAND } from "@/lib/brand";
import { sendLoggedTemplateEmail } from "@/lib/email.server";

function loadLocalEnv() {
  const files = [process.env.EMAIL_SMOKE_ENV_FILE, ".env.local", ".env"].filter(
    Boolean,
  ) as string[];
  for (const file of files) {
    try {
      const path = file.startsWith("/") ? file : resolve(process.cwd(), file);
      const text = readFileSync(path, "utf8");
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
        const index = trimmed.indexOf("=");
        const key = trimmed.slice(0, index).trim();
        const raw = trimmed.slice(index + 1).trim();
        if (!process.env[key]) {
          process.env[key] = raw.replace(/^['"]|['"]$/g, "");
        }
      }
    } catch {
      // Optional local env file.
    }
  }
}

loadLocalEnv();

const recipient = process.env.BOOKING_NOTIFICATION_EMAIL;
if (!recipient) {
  throw new Error("BOOKING_NOTIFICATION_EMAIL is not configured.");
}

const dateKey = new Date().toISOString().slice(0, 10);
const idempotencyKey = `manual_email_smoke:${dateKey}:booking_confirmation`;

const result = await sendLoggedTemplateEmail({
  templateKey: "booking_confirmation",
  locale: "en",
  to: recipient,
  idempotencyKey,
  input: {
    bookingRef: "EMAILTEST",
    guestName: "Quick Key",
    customerName: "Quick Key Email Test",
    customerEmail: recipient,
    vehicle: "Email system test",
    pickup: "No booking created",
    return: "No booking created",
    delivery: "Internal test only",
    collection: "Internal test only",
    total: "$0",
    paymentStatus: "Test email only",
    accountUrl: `${BRAND.website}/account/bookings`,
  },
});

console.log(JSON.stringify({ ok: true, status: result.status, recipientConfigured: true }));
