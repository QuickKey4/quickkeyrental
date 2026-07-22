import { supportedLocales } from "@/i18n/config";
import { renderEmailTemplate } from "@/lib/email.server";

const customerTemplates = [
  "booking_confirmation",
  "cancellation",
  "document_approved",
  "document_rejected",
] as const;

const adminTemplates = [
  "admin_booking_confirmed",
  "admin_booking_cancelled",
  "admin_document_uploaded",
] as const;

const input = {
  bookingRef: "EMAILTEST",
  guestName: "Quick Key",
  customerName: "Quick Key Email Test",
  customerEmail: "owner@example.com",
  customerPhone: "+5999 000 0000",
  vehicle: "Toyota Agya",
  pickup: "2026-07-20 10:00",
  return: "2026-07-24 10:00",
  delivery: "Curaçao International Airport",
  collection: "Curaçao International Airport",
  total: "$220",
  paymentStatus: "paid",
  cancellationFee: "$55",
  cancellationFeeStatus: "Manual handling required",
  documentType: "Driver's license",
  documentId: "00000000-0000-4000-8000-000000000000",
  uploadedAt: "2026-07-12T20:00:00Z",
  rejectionReason: "Photo is not clear enough.",
  accountUrl: "https://www.quickkeyrentalcar.com/account/documents",
  adminUrl: "https://www.quickkeyrentalcar.com/admin/documents",
};

for (const locale of supportedLocales) {
  for (const template of customerTemplates) {
    const rendered = renderEmailTemplate(template, locale, input);
    if (!rendered.subject || !rendered.html.includes("quick-key-rental-logo-transparent.png")) {
      throw new Error(`Render failed for ${template}/${locale}`);
    }
  }
}

for (const template of adminTemplates) {
  const rendered = renderEmailTemplate(template, "en", input);
  if (!rendered.subject || !rendered.html.includes("quick-key-rental-logo-transparent.png")) {
    throw new Error(`Render failed for ${template}/en`);
  }
}

console.log(
  JSON.stringify({
    ok: true,
    customerTemplateCount: customerTemplates.length,
    adminTemplateCount: adminTemplates.length,
    localeCount: supportedLocales.length,
  }),
);
