import { BRAND } from "@/lib/brand";

export type CancellationBooking = {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  pickup_date: string;
  return_date: string;
  pickup_time: string;
  return_time: string;
  delivery_address: string | null;
  total: number;
  cancellation_fee?: number | null;
  cars?: { name?: string | null } | null;
};

function formatCancellationHtml(booking: CancellationBooking, forOwner: boolean): string {
  const carName = booking.cars?.name ?? "Rental car";
  const ref = booking.id.slice(0, 8).toUpperCase();
  const location = booking.delivery_address ?? "See booking details";
  const fee = Number(booking.cancellation_fee ?? 0);
  const feeRow =
    fee > 0
      ? `<tr><td style="padding:6px 0;color:#666">Cancellation fee</td><td style="padding:6px 0"><strong>$${fee.toFixed(0)}</strong></td></tr>`
      : "";

  const intro = forOwner
    ? `<p>A customer has cancelled their booking.${fee > 0 ? ` A cancellation fee of $${fee.toFixed(0)} was accepted.` : ""}</p>`
    : `<p>Your Quick Key Rental booking has been cancelled as requested.${fee > 0 ? ` The cancellation fee of $${fee.toFixed(0)} will be collected as agreed.` : ""}</p>`;

  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#111;line-height:1.5">
    <div style="max-width:520px;margin:0 auto;padding:24px">
      <p style="font-weight:700;color:#e5252a;margin:0 0 16px">QUICKKEY RENTAL</p>
      ${intro}
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
        <tr><td style="padding:6px 0;color:#666">Reference</td><td style="padding:6px 0"><strong>${ref}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#666">Vehicle</td><td style="padding:6px 0">${carName}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Guest</td><td style="padding:6px 0">${booking.guest_name}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0">${booking.guest_email}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Phone</td><td style="padding:6px 0">${booking.guest_phone}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Dates</td><td style="padding:6px 0">${booking.pickup_date} → ${booking.return_date}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Location</td><td style="padding:6px 0">${location}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Total</td><td style="padding:6px 0">$${Number(booking.total).toFixed(0)}</td></tr>
        ${feeRow}
      </table>
      <p style="font-size:13px;color:#666">Questions? WhatsApp ${BRAND.phone} or email ${BRAND.email}</p>
    </div>
  </body></html>`;
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const from = process.env.BOOKING_FROM_EMAIL ?? `Quick Key Rental <onboarding@resend.dev>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email failed: ${body}`);
  }
}

export async function sendBookingCancellationEmails(booking: CancellationBooking): Promise<void> {
  const ref = booking.id.slice(0, 8).toUpperCase();
  const ownerEmail = process.env.BOOKING_NOTIFICATION_EMAIL ?? BRAND.email;

  await Promise.all([
    sendResendEmail(
      booking.guest_email,
      `Booking ${ref} cancelled — Quick Key Rental`,
      formatCancellationHtml(booking, false),
    ),
    sendResendEmail(
      ownerEmail,
      `Cancelled booking ${ref} — ${booking.guest_name}`,
      formatCancellationHtml(booking, true),
    ),
  ]);
}
