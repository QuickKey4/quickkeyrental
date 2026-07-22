import { getServerConfig } from "@/lib/config.server";
import { renderEmailTemplate, sendResendEmail } from "@/lib/email.server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin.server";
import type { SupportedLocale } from "@/i18n/config";
import {
  getSentooTransactionStatus,
  isSentooStatusFinal,
} from "@/features/booking/api/sentoo.server";
import { confirmBookingSentooPayment } from "@/features/booking/api/booking-confirm.server";

const BATCH_SIZE = 25;

type MaintenanceResult = {
  ok: true;
  processed: Record<string, number>;
};

function bookingRef(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function parseOperationalDate(date: string, time?: string | null): Date {
  return new Date(`${date}T${(time ?? "10:00").slice(0, 5)}:00-04:00`);
}

function resolveLocale(value: unknown): SupportedLocale {
  return value === "nl" || value === "es" || value === "pap" || value === "pt" ? value : "en";
}

async function recordJob(jobName: string) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("maintenance_job_runs")
    .insert({ job_name: jobName })
    .select("id")
    .single();
  return data?.id as string | undefined;
}

async function finishJob(
  id: string | undefined,
  status: "success" | "failed",
  processed: number,
  error?: string,
) {
  if (!id) return;
  const supabase = getSupabaseAdminClient();
  await supabase
    .from("maintenance_job_runs")
    .update({
      status,
      processed_count: processed,
      error_message: error?.slice(0, 500) ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", id);
}

async function reconcileSentooPayments(): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, sentoo_transaction_id, sentoo_status, payment_status")
    .eq("payment_provider", "sentoo")
    .not("sentoo_transaction_id", "is", null)
    .neq("payment_status", "paid")
    .limit(BATCH_SIZE);

  let processed = 0;
  for (const booking of bookings ?? []) {
    if (!booking.sentoo_transaction_id || isSentooStatusFinal(booking.sentoo_status)) continue;
    const current = await getSentooTransactionStatus(booking.sentoo_transaction_id);
    await supabase.from("bookings").update({ sentoo_status: current.status }).eq("id", booking.id);
    if (current.status === "success") {
      await confirmBookingSentooPayment(booking.id, booking.sentoo_transaction_id);
    }
    processed += 1;
  }
  return processed;
}

async function cleanupDocuments(): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: docs } = await supabase
    .from("documents")
    .select("id, file_path, deleted_at, deletion_reason")
    .not("file_path", "is", null)
    .lte("deletion_due_at", now)
    .limit(BATCH_SIZE);

  let processed = 0;
  for (const doc of docs ?? []) {
    if (doc.file_path) {
      await supabase.storage.from("customer-documents").remove([doc.file_path]);
    }
    await supabase
      .from("documents")
      .update({
        deleted_at: doc.deleted_at ?? new Date().toISOString(),
        file_path: "",
        deletion_reason: doc.deletion_reason ?? "retention_cleanup",
      })
      .eq("id", doc.id);
    processed += 1;
  }
  return processed;
}

async function queuePostRentalEmails(): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, user_id, guest_name, guest_email, return_date, return_time, status")
    .neq("status", "cancelled")
    .order("return_date", { ascending: true })
    .limit(100);

  const now = Date.now();
  let queued = 0;
  for (const booking of bookings ?? []) {
    const completedAt = parseOperationalDate(booking.return_date, booking.return_time).getTime();
    if (now - completedAt < 24 * 60 * 60 * 1000) continue;

    for (const templateKey of ["post_rental_thank_you", "honest_review_request"]) {
      const { error } = await supabase.from("email_deliveries").insert({
        template_key: templateKey,
        locale: "en",
        recipient_email: booking.guest_email,
        booking_id: booking.id,
        customer_id: booking.user_id,
        idempotency_key: `${templateKey}:${booking.id}`,
        payload: {
          bookingRef: bookingRef(booking.id),
          guestName: booking.guest_name,
        },
      });

      if (!error) queued += 1;
    }
  }
  return queued;
}

async function sendQueuedEmails(): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { data: emails } = await supabase
    .from("email_deliveries")
    .select("*")
    .eq("status", "queued")
    .lte("next_attempt_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(10);

  let sent = 0;
  for (const email of emails ?? []) {
    await supabase
      .from("email_deliveries")
      .update({ status: "sending", attempts: Number(email.attempts ?? 0) + 1 })
      .eq("id", email.id);

    try {
      const rendered = renderEmailTemplate(
        email.template_key,
        resolveLocale(email.locale),
        email.payload ?? {},
      );
      await sendResendEmail(email.recipient_email, rendered.subject, rendered.html, rendered.text);
      await supabase
        .from("email_deliveries")
        .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
        .eq("id", email.id);
      sent += 1;
    } catch (error) {
      await supabase
        .from("email_deliveries")
        .update({
          status: "failed",
          last_error: error instanceof Error ? error.message.slice(0, 500) : "Email failed",
          next_attempt_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        })
        .eq("id", email.id);
    }
  }
  return sent;
}

async function awardCompletedRentalPoints(): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, user_id, guest_email, total, return_date, return_time, status")
    .neq("status", "cancelled")
    .limit(100);

  const now = Date.now();
  let awarded = 0;
  for (const booking of bookings ?? []) {
    const completedAt = parseOperationalDate(booking.return_date, booking.return_time).getTime();
    if (now - completedAt < 24 * 60 * 60 * 1000) continue;

    const points = Math.max(0, Math.floor(Number(booking.total ?? 0)));
    if (points <= 0) continue;

    const { error } = await supabase.from("reward_transactions").insert({
      customer_id: booking.user_id,
      customer_email: booking.guest_email,
      booking_id: booking.id,
      transaction_type: "rental_earned",
      points_delta: points,
      reason: "Completed rental spend",
      idempotency_key: `rental_earned:${booking.id}`,
      metadata: { total: Number(booking.total ?? 0) },
    });

    if (!error) awarded += 1;
  }
  return awarded;
}

export async function handleMaintenanceRequest(request: Request): Promise<Response> {
  const config = getServerConfig();
  if (!config.maintenanceSecret) {
    return Response.json({ ok: false, error: "Maintenance is not configured." }, { status: 503 });
  }

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${config.maintenanceSecret}`) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const jobId = await recordJob("maintenance");
  const processed: Record<string, number> = {};
  try {
    processed.sentoo = await reconcileSentooPayments();
    processed.documentCleanup = await cleanupDocuments();
    processed.queuedPostRentalEmails = await queuePostRentalEmails();
    processed.sentEmails = await sendQueuedEmails();
    const total = Object.values(processed).reduce((sum, count) => sum + count, 0);
    await finishJob(jobId, "success", total);
    return Response.json({ ok: true, processed } satisfies MaintenanceResult);
  } catch (error) {
    await finishJob(
      jobId,
      "failed",
      Object.values(processed).reduce((sum, count) => sum + count, 0),
      error instanceof Error ? error.message : "Maintenance failed",
    );
    return Response.json({ ok: false, processed }, { status: 500 });
  }
}
