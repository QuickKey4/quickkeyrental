import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { BRAND } from "@/lib/brand";
import { sendLoggedTemplateEmail } from "@/lib/email.server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin.server";

import { sendBookingCancellationEmails } from "./cancellation.server";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  driver_license: "Driver's license",
  passport_id: "Passport",
  id_card: "ID card",
};

function documentTypeLabel(type: string): string {
  return DOCUMENT_TYPE_LABELS[type] ?? type.replaceAll("_", " ");
}

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

export const sendDocumentUploadedNotificationFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ documentId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseAdminClient();
    const { data: doc, error } = await supabase
      .from("documents")
      .select("id, user_id, document_type, created_at, profiles ( full_name, email, phone )")
      .eq("id", data.documentId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!doc) throw new Error("Document not found.");

    const { data: latestBooking } = await supabase
      .from("bookings")
      .select("id, guest_name, guest_email, guest_phone, pickup_date, pickup_time, cars ( name )")
      .eq("user_id", doc.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const profile = doc.profiles as {
      full_name: string | null;
      email: string | null;
      phone: string | null;
    } | null;
    const ownerEmail = process.env.BOOKING_NOTIFICATION_EMAIL ?? BRAND.email;
    const input = {
      bookingRef: latestBooking?.id ? latestBooking.id.slice(0, 8).toUpperCase() : undefined,
      customerName: profile?.full_name ?? latestBooking?.guest_name,
      customerEmail: profile?.email ?? latestBooking?.guest_email,
      customerPhone: profile?.phone ?? latestBooking?.guest_phone,
      vehicle: latestBooking?.cars?.name,
      pickup:
        latestBooking?.pickup_date && latestBooking.pickup_time
          ? `${latestBooking.pickup_date} ${latestBooking.pickup_time}`
          : undefined,
      documentType: documentTypeLabel(doc.document_type),
      documentId: doc.id,
      uploadedAt: doc.created_at,
      adminUrl: `${BRAND.website}/admin/documents?documentId=${doc.id}`,
    };

    await sendLoggedTemplateEmail({
      templateKey: "admin_document_uploaded",
      locale: "en",
      to: ownerEmail,
      input,
      bookingId: latestBooking?.id ?? null,
      documentId: doc.id,
      customerId: doc.user_id,
      idempotencyKey: `document_uploaded:admin:${doc.id}`,
    });
    return { ok: true as const };
  });
