import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { sendBookingCancellationEmails } from "@/features/account/api/cancellation.server";
import { assertCarAvailableForPeriod } from "@/features/booking/api/availability.server";
import { BRAND } from "@/lib/brand";
import { resolveEmailLocale, sendLoggedTemplateEmail } from "@/lib/email.server";
import {
  formatDiscountSummary,
  resolveEffectiveDailyPrice,
  type DiscountScope,
  type DiscountType,
  type PricingDiscountRow,
} from "@/lib/pricing.server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin.server";
import type { Tables } from "@/lib/supabase/database.types";

import { assertAdminSecret } from "./admin-auth.server";
import {
  addDays,
  daysBetweenInclusive,
  filterAdminBookings,
  getOperationalStatus,
  isHiddenAdminCustomer,
  todayKey,
  type AdminBookingFilter,
  type AdminBooking,
} from "../lib/admin-utils";

const adminCtx = z.object({
  adminSecret: z.string().min(1),
});

export const verifyAdminSecret = createServerFn({ method: "POST" })
  .inputValidator(z.object({ secret: z.string().min(1) }))
  .handler(async ({ data }) => {
    assertAdminSecret(data.secret);
    return { ok: true as const };
  });

const BOOKING_SELECT = `
  *,
  cars ( id, name, image_url, daily_price, license_plate, fleet_status )
`;

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  driver_license: "Driver's license",
  passport_id: "Passport",
  id_card: "ID card",
};

const adminDocumentQuerySchema = adminCtx.extend({
  status: z.enum(["pending", "approved", "rejected", "deleted", "all"]).default("pending"),
  search: z.string().trim().max(120).optional(),
  sort: z.enum(["newest", "oldest_pending", "pickup_date", "customer_name"]).default("newest"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(12),
});

type AdminDocumentStatusFilter = z.infer<typeof adminDocumentQuerySchema>["status"];
type AdminDocumentSort = z.infer<typeof adminDocumentQuerySchema>["sort"];

type AdminDocumentBookingContext = {
  id: string;
  guest_name: string;
  guest_email: string;
  pickup_date: string;
  cars: { name: string | null } | null;
};

type AdminDocumentRow = Tables<"documents"> & {
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null;
  booking: AdminDocumentBookingContext | null;
};

function documentTypeLabel(type: string): string {
  return DOCUMENT_TYPE_LABELS[type] ?? type.replaceAll("_", " ");
}

function documentStatus(doc: Pick<Tables<"documents">, "deleted_at" | "verification_status">) {
  if (doc.deleted_at) return "deleted";
  return String(doc.verification_status ?? "pending");
}

function matchesDocumentStatus(
  doc: Pick<Tables<"documents">, "deleted_at" | "verification_status">,
  status: AdminDocumentStatusFilter,
): boolean {
  if (status === "all") return true;
  if (status === "deleted") return Boolean(doc.deleted_at);
  return !doc.deleted_at && documentStatus(doc) === status;
}

function documentSearchText(doc: AdminDocumentRow): string {
  const bookingRef = doc.booking?.id ? doc.booking.id.slice(0, 8).toUpperCase() : "";
  return [
    doc.file_name,
    doc.document_type,
    doc.verification_status,
    doc.profiles?.full_name,
    doc.profiles?.email,
    doc.profiles?.phone,
    doc.booking?.guest_name,
    doc.booking?.guest_email,
    doc.booking?.cars?.name,
    bookingRef,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function customerNameForDocument(doc: AdminDocumentRow): string {
  return doc.profiles?.full_name ?? doc.booking?.guest_name ?? "";
}

function sortAdminDocuments(rows: AdminDocumentRow[], sort: AdminDocumentSort): AdminDocumentRow[] {
  const sorted = [...rows];
  if (sort === "oldest_pending") {
    return sorted.sort((a, b) => {
      const aPending = documentStatus(a) === "pending" ? 0 : 1;
      const bPending = documentStatus(b) === "pending" ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return (a.created_at ?? a.uploaded_at ?? "").localeCompare(
        b.created_at ?? b.uploaded_at ?? "",
      );
    });
  }
  if (sort === "pickup_date") {
    return sorted.sort((a, b) =>
      (a.booking?.pickup_date ?? "9999-12-31").localeCompare(
        b.booking?.pickup_date ?? "9999-12-31",
      ),
    );
  }
  if (sort === "customer_name") {
    return sorted.sort((a, b) =>
      customerNameForDocument(a).localeCompare(customerNameForDocument(b)),
    );
  }
  return sorted.sort((a, b) =>
    (b.created_at ?? b.uploaded_at ?? "").localeCompare(a.created_at ?? a.uploaded_at ?? ""),
  );
}

async function attachDocumentBookingContext(
  rows: Array<Tables<"documents"> & { profiles: AdminDocumentRow["profiles"] }>,
): Promise<AdminDocumentRow[]> {
  const userIds = [...new Set(rows.map((doc) => doc.user_id).filter(Boolean))];
  const bookingByUser = new Map<string, AdminDocumentBookingContext>();
  const supabase = getSupabaseAdminClient();

  if (userIds.length > 0) {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, user_id, guest_name, guest_email, pickup_date, created_at, cars ( name )")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    for (const booking of bookings ?? []) {
      if (booking.user_id && !bookingByUser.has(booking.user_id)) {
        bookingByUser.set(booking.user_id, {
          id: booking.id,
          guest_name: booking.guest_name,
          guest_email: booking.guest_email,
          pickup_date: booking.pickup_date,
          cars: booking.cars as { name: string | null } | null,
        });
      }
    }
  }

  return rows.map((doc) => ({
    ...doc,
    booking: bookingByUser.get(doc.user_id) ?? null,
  }));
}

async function sendDocumentReviewEmail(input: {
  to: string | null | undefined;
  guestName: string | null | undefined;
  bookingRef?: string | null;
  templateKey: "document_approved" | "document_rejected";
  documentType: string;
  documentId: string;
  customerId: string;
  rejectionReason?: string;
  locale?: string | null;
}): Promise<boolean> {
  if (!input.to) return false;

  const emailInput = {
    guestName: input.guestName ?? undefined,
    bookingRef: input.bookingRef ?? undefined,
    documentType: documentTypeLabel(input.documentType),
    rejectionReason: input.rejectionReason,
    accountUrl: `${BRAND.website}/account/documents`,
  };

  const reasonKey =
    input.templateKey === "document_rejected"
      ? `:${encodeURIComponent((input.rejectionReason ?? "").trim().toLowerCase()).slice(0, 160)}`
      : "";

  await sendLoggedTemplateEmail({
    templateKey: input.templateKey,
    locale: resolveEmailLocale(input.locale),
    to: input.to,
    input: emailInput,
    bookingId: null,
    documentId: input.documentId,
    customerId: input.customerId,
    idempotencyKey: `${input.templateKey}:customer:${input.documentId}${reasonKey}`,
  });
  return true;
}

async function loadAllBookings(): Promise<AdminBooking[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .order("pickup_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as AdminBooking[];
}

export const getAdminDashboard = createServerFn({ method: "POST" })
  .inputValidator(adminCtx)
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const today = todayKey();
    const monthStart = `${today.slice(0, 7)}-01`;
    const bookings = await loadAllBookings();
    const supabase = getSupabaseAdminClient();

    const { data: cars } = await supabase.from("cars").select("*").order("name");

    const active = bookings.filter((b) => getOperationalStatus(b) === "active");
    const pending = bookings.filter((b) => b.status === "pending");
    const todayPickups = bookings.filter(
      (b) => b.status !== "cancelled" && b.pickup_date === today,
    );
    const todayReturns = bookings.filter(
      (b) => b.status !== "cancelled" && b.return_date === today,
    );
    const upcomingReturns = bookings
      .filter((b) => b.status !== "cancelled" && b.return_date >= today)
      .sort((a, b) => a.return_date.localeCompare(b.return_date))
      .slice(0, 6);

    const rentedCarIds = new Set(active.map((b) => b.car_id));
    const fleet = cars ?? [];
    const availableCars = fleet.filter(
      (c) => c.is_active && c.fleet_status !== "disabled" && !rentedCarIds.has(c.id),
    );

    const monthlyRevenue = bookings
      .filter(
        (b) =>
          b.status !== "cancelled" &&
          b.pickup_date >= monthStart &&
          (b.payment_status === "paid" || b.status === "confirmed"),
      )
      .reduce((sum, b) => sum + Number(b.total), 0);

    const timelineStart = today;
    const timelineEnd = addDays(today, 6);
    const timelineBookings = bookings.filter(
      (b) =>
        b.status !== "cancelled" && b.pickup_date <= timelineEnd && b.return_date >= timelineStart,
    );

    const recentBookings = bookings.slice(0, 8);

    const recentCustomers = bookings
      .filter((b) => b.created_at)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 6)
      .map((b) => ({
        name: b.guest_name,
        email: b.guest_email,
        action: `Booked ${b.cars?.name ?? "vehicle"}`,
        date: b.created_at,
      }));

    const sortByTime = (list: AdminBooking[], timeKey: "pickup_time" | "return_time") =>
      [...list].sort((a, b) => a[timeKey].localeCompare(b[timeKey]));

    const { data: discountRows } = await supabase
      .from("pricing_discounts")
      .select("*")
      .order("starts_at", { ascending: false });

    const discountSummary = buildDiscountSummary((discountRows ?? []) as PricingDiscountRow[]);

    return {
      metrics: {
        todayPickups: todayPickups.length,
        todayReturns: todayReturns.length,
        carsRented: active.length,
        availableCars: availableCars.length,
        pendingBookings: pending.length,
        monthlyRevenue,
      },
      discountSummary,
      todayPickups: sortByTime(todayPickups, "pickup_time"),
      todayReturns: sortByTime(todayReturns, "return_time"),
      pendingBookings: pending,
      timelineBookings,
      recentBookings,
      upcomingReturns,
      recentCustomers,
    };
  });

export const getAdminBookings = createServerFn({ method: "POST" })
  .inputValidator(
    adminCtx.extend({
      filter: z
        .enum([
          "all",
          "today",
          "upcoming",
          "active",
          "completed",
          "cancelled",
          "pending",
          "archived",
        ])
        .default("upcoming"),
      search: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    let bookings = await loadAllBookings();
    bookings = filterAdminBookings(bookings, data.filter as AdminBookingFilter);

    const q = data.search?.trim().toLowerCase();
    if (q) {
      bookings = bookings.filter((b) => {
        const ref = b.id.slice(0, 8).toLowerCase();
        return (
          ref.includes(q) ||
          b.guest_name.toLowerCase().includes(q) ||
          b.guest_email.toLowerCase().includes(q) ||
          b.guest_phone.toLowerCase().includes(q)
        );
      });
    }

    return bookings;
  });

export const getAdminBooking = createServerFn({ method: "POST" })
  .inputValidator(adminCtx.extend({ bookingId: z.string().uuid() }))
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const supabase = getSupabaseAdminClient();

    const { data: booking, error } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("id", data.bookingId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!booking) throw new Error("Booking not found.");

    const { data: extras } = await supabase
      .from("booking_extras")
      .select("*")
      .eq("booking_id", data.bookingId);

    const { data: notes } = await supabase
      .from("booking_internal_notes")
      .select("*")
      .eq("booking_id", data.bookingId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    const { data: changeEvents } = await supabase
      .from("booking_change_events")
      .select("*")
      .eq("booking_id", data.bookingId)
      .order("created_at", { ascending: false });

    let documents: AdminDocumentRow[] = [];
    if (booking.user_id) {
      const { data: docs } = await supabase
        .from("documents")
        .select("*, profiles ( full_name, email, phone )")
        .eq("user_id", booking.user_id)
        .order("created_at", { ascending: false });
      documents = await attachDocumentBookingContext(docs ?? []);
    }

    return {
      booking: booking as AdminBooking,
      extras: extras ?? [],
      documents,
      notes: notes ?? [],
      changeEvents: changeEvents ?? [],
    };
  });

export const addAdminBookingNote = createServerFn({ method: "POST" })
  .inputValidator(
    adminCtx.extend({
      bookingId: z.string().uuid(),
      body: z.string().trim().min(1).max(5000),
      isPinned: z.boolean().default(false),
    }),
  )
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const supabase = getSupabaseAdminClient();

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("id", data.bookingId)
      .maybeSingle();

    if (bookingError) throw new Error(bookingError.message);
    if (!booking) throw new Error("Booking not found.");

    const { error } = await supabase.from("booking_internal_notes").insert({
      booking_id: data.bookingId,
      author_identifier: "admin",
      author_display_label: "QuickKey Admin",
      body: data.body,
      is_pinned: data.isPinned,
    });

    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const updateAdminBookingArchive = createServerFn({ method: "POST" })
  .inputValidator(
    adminCtx.extend({
      bookingId: z.string().uuid(),
      archived: z.boolean(),
      reason: z.string().trim().max(1000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const supabase = getSupabaseAdminClient();

    const patch = data.archived
      ? {
          archived_at: new Date().toISOString(),
          archived_by: "admin",
          archive_reason: data.reason?.trim() || null,
        }
      : {
          archived_at: null,
          archived_by: null,
          archive_reason: null,
        };

    const { error } = await supabase.from("bookings").update(patch).eq("id", data.bookingId);
    if (error) throw new Error(error.message);

    return { ok: true as const };
  });

export const updateAdminBooking = createServerFn({ method: "POST" })
  .inputValidator(
    adminCtx.extend({
      bookingId: z.string().uuid(),
      pickupDate: z.string().optional(),
      returnDate: z.string().optional(),
      carId: z.string().uuid().optional(),
      pickupLocation: z.string().optional(),
      returnLocation: z.string().optional(),
      deliveryAddress: z.string().optional(),
      collectionAddress: z.string().optional(),
      status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const supabase = getSupabaseAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", data.bookingId)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);
    if (!existing) throw new Error("Booking not found.");

    const patch: Record<string, unknown> = {};
    if (data.pickupDate) patch.pickup_date = data.pickupDate;
    if (data.returnDate) patch.return_date = data.returnDate;
    if (data.carId) patch.car_id = data.carId;
    if (data.deliveryAddress !== undefined) patch.delivery_address = data.deliveryAddress;
    if (data.collectionAddress !== undefined) patch.collection_address = data.collectionAddress;
    if (data.status) patch.status = data.status;
    const shouldSendCancellationEmail =
      data.status === "cancelled" && existing.status !== "cancelled";

    if (data.pickupLocation !== undefined) {
      if (existing.delivery_address?.trim()) {
        patch.delivery_address = data.pickupLocation;
      } else if (existing.accommodation?.trim()) {
        patch.accommodation = data.pickupLocation;
      } else {
        patch.pickup_location = data.pickupLocation;
      }
    }

    if (data.returnLocation !== undefined) {
      if (existing.collection_address?.trim()) {
        patch.collection_address = data.returnLocation;
      } else {
        patch.return_location = data.returnLocation;
      }
    }

    const nextCarId = (patch.car_id as string | undefined) ?? existing.car_id;
    const nextPickup = (patch.pickup_date as string | undefined) ?? existing.pickup_date;
    const nextReturn = (patch.return_date as string | undefined) ?? existing.return_date;

    if (nextReturn < nextPickup) {
      throw new Error("Return date must be on or after pickup date.");
    }

    const carOrDatesChanged =
      nextCarId !== existing.car_id ||
      nextPickup !== existing.pickup_date ||
      nextReturn !== existing.return_date;

    if (carOrDatesChanged) {
      const { data: car, error: carError } = await supabase
        .from("cars")
        .select("fleet_status, is_active, name, daily_price")
        .eq("id", nextCarId)
        .maybeSingle();

      if (carError) throw new Error(carError.message);
      if (!car?.is_active) {
        throw new Error("That vehicle is not active and cannot be assigned.");
      }
      if (car.fleet_status === "disabled") {
        throw new Error(`${car.name} is disabled and cannot be assigned.`);
      }
      if (car.fleet_status === "maintenance") {
        throw new Error(`${car.name} is in maintenance and cannot be assigned.`);
      }

      await assertCarAvailableForPeriod(nextCarId, nextPickup, nextReturn, data.bookingId);

      const days = daysBetweenInclusive(nextPickup, nextReturn);
      const pricing =
        nextCarId !== existing.car_id ? await resolveEffectiveDailyPrice(nextCarId) : null;
      const dailyRate =
        pricing?.effectivePrice ??
        Number(existing.priced_daily_rate ?? car.daily_price ?? Number(existing.subtotal) / days);
      const subtotal = dailyRate * days;

      const { data: extras, error: extrasError } = await supabase
        .from("booking_extras")
        .select("id, price_per_day, quantity")
        .eq("booking_id", data.bookingId);

      if (extrasError) throw new Error(extrasError.message);

      const extraUpdates = (extras ?? []).map((extra) => {
        const total = Number(extra.price_per_day) * Number(extra.quantity ?? 1) * days;
        return supabase.from("booking_extras").update({ total }).eq("id", extra.id);
      });

      const extraResults = await Promise.all(extraUpdates);
      const extraUpdateError = extraResults.find((result) => result.error)?.error;
      if (extraUpdateError) throw new Error(extraUpdateError.message);

      const extrasTotal = (extras ?? []).reduce(
        (sum, extra) => sum + Number(extra.price_per_day) * Number(extra.quantity ?? 1) * days,
        0,
      );
      const insuranceDailyRate = Number(existing.insurance_daily_rate ?? 0);
      const insuranceTotal =
        existing.insurance_option === "daily" && insuranceDailyRate > 0
          ? insuranceDailyRate * days
          : existing.insurance_total;

      patch.subtotal = subtotal;
      patch.extras_total = extrasTotal;
      patch.insurance_total = insuranceTotal;
      patch.total = subtotal + extrasTotal + Number(insuranceTotal ?? 0);
      patch.priced_daily_rate = dailyRate;
      if (pricing) patch.applied_discount_id = pricing.discountId;
    }

    const { error } = await supabase.from("bookings").update(patch).eq("id", data.bookingId);
    if (error) throw new Error(error.message);

    if (shouldSendCancellationEmail) {
      try {
        const { data: cancelledBooking } = await supabase
          .from("bookings")
          .select(BOOKING_SELECT)
          .eq("id", data.bookingId)
          .maybeSingle();

        if (cancelledBooking) {
          await sendBookingCancellationEmails(
            cancelledBooking as Parameters<typeof sendBookingCancellationEmails>[0],
          );
        }
      } catch (emailError) {
        console.error("[quickkey.email.admin_cancellation_failed]", {
          bookingId: data.bookingId,
          error: emailError instanceof Error ? emailError.message : "Unknown email error",
        });
      }
    }

    return { ok: true };
  });

export const getAdminFleet = createServerFn({ method: "POST" })
  .inputValidator(adminCtx)
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const supabase = getSupabaseAdminClient();
    const { data: cars, error } = await supabase.from("cars").select("*").order("name");
    if (error) throw new Error(error.message);

    const bookings = await loadAllBookings();
    const activeByCar = new Map<string, AdminBooking>();
    for (const booking of bookings) {
      if (getOperationalStatus(booking) === "active") {
        activeByCar.set(booking.car_id, booking);
      }
    }

    return (cars ?? []).map((car) => ({
      ...car,
      activeBooking: activeByCar.get(car.id) ?? null,
    }));
  });

export const updateAdminFleetVehicle = createServerFn({ method: "POST" })
  .inputValidator(
    adminCtx.extend({
      carId: z.string().uuid(),
      licensePlate: z.string().optional(),
      mileage: z.number().int().optional(),
      fleetStatus: z
        .enum(["available", "reserved", "on_rental", "maintenance", "disabled"])
        .optional(),
      isActive: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const supabase = getSupabaseAdminClient();
    const patch: Record<string, unknown> = {};
    if (data.licensePlate !== undefined) patch.license_plate = data.licensePlate;
    if (data.mileage !== undefined) patch.mileage = data.mileage;
    if (data.fleetStatus) patch.fleet_status = data.fleetStatus;
    if (data.isActive !== undefined) patch.is_active = data.isActive;

    if (data.fleetStatus === "maintenance" || data.fleetStatus === "disabled") {
      const activeBooking = (await loadAllBookings()).find(
        (booking) => booking.car_id === data.carId && getOperationalStatus(booking) === "active",
      );
      if (activeBooking) {
        throw new Error(
          "This vehicle is currently on rental. Open the active booking before changing fleet status.",
        );
      }
    }

    const { error } = await supabase.from("cars").update(patch).eq("id", data.carId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAdminCalendar = createServerFn({ method: "POST" })
  .inputValidator(
    adminCtx.extend({
      startDate: z.string().optional(),
      days: z.number().int().min(7).max(31).default(14),
    }),
  )
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const start = data.startDate ?? todayKey();
    const end = addDays(start, data.days - 1);
    const supabase = getSupabaseAdminClient();

    const { data: cars, error: carsError } = await supabase.from("cars").select("*").order("name");
    if (carsError) throw new Error(carsError.message);

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, car_id, guest_name, pickup_date, return_date, status, pickup_time, return_time")
      .neq("status", "cancelled")
      .lte("pickup_date", end)
      .gte("return_date", start);

    if (bookingsError) throw new Error(bookingsError.message);

    return {
      startDate: start,
      days: data.days,
      cars: cars ?? [],
      bookings: bookings ?? [],
    };
  });

export const getAdminCustomers = createServerFn({ method: "POST" })
  .inputValidator(adminCtx.extend({ search: z.string().optional() }))
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const bookings = await loadAllBookings();
    const map = new Map<
      string,
      {
        email: string;
        name: string;
        phone: string;
        userId: string | null;
        bookingsCount: number;
        totalSpent: number;
        lastRental: string;
      }
    >();

    for (const booking of bookings) {
      if (isHiddenAdminCustomer(booking)) continue;

      const key = booking.guest_email.toLowerCase();
      const existing = map.get(key);
      const spent = booking.status !== "cancelled" ? Number(booking.total) : 0;
      if (!existing) {
        map.set(key, {
          email: booking.guest_email,
          name: booking.guest_name,
          phone: booking.guest_phone,
          userId: booking.user_id,
          bookingsCount: booking.status !== "cancelled" ? 1 : 0,
          totalSpent: spent,
          lastRental: booking.pickup_date,
        });
      } else {
        if (booking.status !== "cancelled") existing.bookingsCount += 1;
        existing.totalSpent += spent;
        if (booking.pickup_date > existing.lastRental) {
          existing.lastRental = booking.pickup_date;
          existing.name = booking.guest_name;
          existing.phone = booking.guest_phone;
        }
        if (!existing.userId && booking.user_id) existing.userId = booking.user_id;
      }
    }

    let customers = Array.from(map.values()).sort((a, b) =>
      b.lastRental.localeCompare(a.lastRental),
    );
    const q = data.search?.trim().toLowerCase();
    if (q) {
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q),
      );
    }
    return customers;
  });

export const getAdminCustomer = createServerFn({ method: "POST" })
  .inputValidator(adminCtx.extend({ email: z.string().email() }))
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const bookings = (await loadAllBookings()).filter(
      (b) => b.guest_email.toLowerCase() === data.email.toLowerCase() && !isHiddenAdminCustomer(b),
    );
    if (bookings.length === 0) throw new Error("Customer not found.");

    const latest = bookings[0];
    let profile = null;
    let documents: AdminDocumentRow[] = [];

    if (latest.user_id) {
      const supabase = getSupabaseAdminClient();
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", latest.user_id)
        .maybeSingle();
      profile = prof;

      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", latest.user_id);
      documents = await attachDocumentBookingContext(docs ?? []);
    }

    return {
      customer: {
        name: latest.guest_name,
        email: latest.guest_email,
        phone: latest.guest_phone,
        userId: latest.user_id,
        profile,
      },
      bookings,
      documents,
    };
  });

export const getAdminPayments = createServerFn({ method: "POST" })
  .inputValidator(
    adminCtx.extend({
      filter: z.enum(["all", "paid", "unpaid", "pending"]).default("all"),
    }),
  )
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    let bookings = await loadAllBookings();
    const today = todayKey();
    const weekStart = addDays(today, -6);
    const monthStart = `${today.slice(0, 7)}-01`;
    const yearStart = `${today.slice(0, 4)}-01-01`;

    const paid = (b: AdminBooking) => b.status !== "cancelled" && b.payment_status === "paid";

    const sum = (list: AdminBooking[]) =>
      list.filter(paid).reduce((acc, b) => acc + Number(b.total), 0);

    const todayBookings = bookings.filter((b) => b.pickup_date === today);
    const weekBookings = bookings.filter((b) => b.pickup_date >= weekStart);
    const monthBookings = bookings.filter((b) => b.pickup_date >= monthStart);
    const yearBookings = bookings.filter((b) => b.pickup_date >= yearStart);

    const supabase = getSupabaseAdminClient();
    const { data: cars } = await supabase.from("cars").select("id, is_active");
    const activeFleet = (cars ?? []).filter((c) => c.is_active).length;
    const rented = bookings.filter((b) => getOperationalStatus(b) === "active").length;
    const utilization = activeFleet > 0 ? Math.round((rented / activeFleet) * 100) : 0;

    const last30 = Array.from({ length: 30 }, (_, i) => {
      const date = addDays(today, -29 + i);
      const dayBookings = bookings.filter((b) => b.pickup_date === date && paid(b));
      return {
        date,
        revenue: dayBookings.reduce((s, b) => s + Number(b.total), 0),
        bookings: dayBookings.length,
      };
    });

    if (data.filter === "paid") {
      bookings = bookings.filter((b) => b.status !== "cancelled" && b.payment_status === "paid");
    } else if (data.filter === "unpaid") {
      bookings = bookings.filter((b) => b.status !== "cancelled" && b.payment_status !== "paid");
    } else if (data.filter === "pending") {
      bookings = bookings.filter((b) => b.status === "pending");
    }

    const paymentRows = bookings.slice(0, 100).map((b) => ({
      id: b.id,
      ref: b.id.slice(0, 8).toUpperCase(),
      guestName: b.guest_name,
      total: Number(b.total),
      paymentStatus: b.payment_status,
      bookingStatus: b.status,
      paymentProvider: b.payment_provider,
      paymentReference: b.sentoo_transaction_id ?? b.stripe_payment_intent_id,
      sentooStatus: b.sentoo_status,
      pickupDate: b.pickup_date,
    }));

    return {
      revenue: {
        today: sum(todayBookings),
        week: sum(weekBookings),
        month: sum(monthBookings),
        year: sum(yearBookings),
      },
      utilization,
      chart: last30,
      payments: paymentRows,
    };
  });

export const getAdminDocuments = createServerFn({ method: "POST" })
  .inputValidator(adminDocumentQuerySchema)
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const supabase = getSupabaseAdminClient();
    const { data: documents, error } = await supabase
      .from("documents")
      .select("*, profiles ( full_name, email, phone )")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw new Error(error.message);
    const rows = await attachDocumentBookingContext(documents ?? []);
    const q = data.search?.trim().toLowerCase();
    let filtered = rows.filter((doc) => matchesDocumentStatus(doc, data.status));

    if (q) {
      filtered = filtered.filter((doc) => documentSearchText(doc).includes(q));
    }

    const sorted = sortAdminDocuments(filtered, data.sort);
    const pageSize = data.pageSize;
    const page = data.page;
    const start = (page - 1) * pageSize;

    return {
      documents: sorted.slice(start, start + pageSize),
      total: sorted.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    };
  });

export const getAdminDocumentUrl = createServerFn({ method: "POST" })
  .inputValidator(adminCtx.extend({ documentId: z.string().uuid() }))
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const supabase = getSupabaseAdminClient();

    const { data: doc, error } = await supabase
      .from("documents")
      .select("file_path, file_url, file_name, deleted_at")
      .eq("id", data.documentId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!doc) throw new Error("Document not found.");
    if (doc.deleted_at) throw new Error("Document file is no longer available.");

    if (!doc.file_path) {
      if (doc.file_url) return { url: doc.file_url, fileName: doc.file_name };
      throw new Error("Document file is not available.");
    }

    const { data: signed, error: signError } = await supabase.storage
      .from("customer-documents")
      .createSignedUrl(doc.file_path, 3600);

    if (signError) throw new Error(signError.message);

    return { url: signed.signedUrl, fileName: doc.file_name };
  });

export const updateAdminDocumentStatus = createServerFn({ method: "POST" })
  .inputValidator(
    adminCtx.extend({
      documentId: z.string().uuid(),
      status: z.enum(["pending", "approved", "rejected"]),
      rejectionReason: z.string().trim().max(500).optional(),
    }),
  )
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const supabase = getSupabaseAdminClient();
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*, profiles ( full_name, email )")
      .eq("id", data.documentId)
      .maybeSingle();

    if (docError) throw new Error(docError.message);
    if (!doc) throw new Error("Document not found.");
    if (doc.deleted_at) throw new Error("Deleted documents cannot be reviewed.");
    if (data.status === "rejected" && !data.rejectionReason?.trim()) {
      throw new Error("Enter a rejection reason.");
    }

    const patch: Record<string, unknown> = { verification_status: data.status };
    const previousStatus = String(doc.verification_status ?? "");
    const previousReason = doc.deletion_reason ?? "";
    const shouldSendApprovedEmail = data.status === "approved" && previousStatus !== "approved";
    const shouldSendRejectedEmail =
      data.status === "rejected" &&
      (previousStatus !== "rejected" || previousReason !== data.rejectionReason);

    if (data.status === "approved") {
      patch.verified_at = doc.verified_at ?? new Date().toISOString();
      patch.deletion_due_at = null;
      patch.deletion_reason = null;
    } else if (data.status === "rejected") {
      patch.verified_at = null;
      patch.deletion_due_at = null;
      patch.deletion_reason = data.rejectionReason?.trim();
    }

    const { error } = await supabase.from("documents").update(patch).eq("id", data.documentId);
    if (error) throw new Error(error.message);

    let emailSent = false;
    const profile = doc.profiles as { full_name: string | null; email: string | null } | null;
    const { data: latestBooking } = await supabase
      .from("bookings")
      .select("id, guest_name, guest_email, locale")
      .eq("user_id", doc.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const bookingRef = latestBooking?.id ? latestBooking.id.slice(0, 8).toUpperCase() : null;
    try {
      if (shouldSendApprovedEmail) {
        emailSent = await sendDocumentReviewEmail({
          to: profile?.email ?? latestBooking?.guest_email,
          guestName: profile?.full_name ?? latestBooking?.guest_name,
          bookingRef,
          templateKey: "document_approved",
          documentType: doc.document_type,
          documentId: doc.id,
          customerId: doc.user_id,
          locale: latestBooking?.locale,
        });
      } else if (shouldSendRejectedEmail) {
        emailSent = await sendDocumentReviewEmail({
          to: profile?.email ?? latestBooking?.guest_email,
          guestName: profile?.full_name ?? latestBooking?.guest_name,
          bookingRef,
          templateKey: "document_rejected",
          documentType: doc.document_type,
          documentId: doc.id,
          customerId: doc.user_id,
          rejectionReason: data.rejectionReason?.trim(),
          locale: latestBooking?.locale,
        });
      }
    } catch {
      emailSent = false;
    }

    return { ok: true, emailSent };
  });

export const deleteAdminDocument = createServerFn({ method: "POST" })
  .inputValidator(
    adminCtx.extend({
      documentId: z.string().uuid(),
      deletionReason: z.string().trim().min(3).max(500),
    }),
  )
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const supabase = getSupabaseAdminClient();
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*, profiles ( full_name, email )")
      .eq("id", data.documentId)
      .maybeSingle();

    if (docError) throw new Error(docError.message);
    if (!doc) throw new Error("Document not found.");

    if (doc.deleted_at) {
      return { ok: true as const, alreadyDeleted: true as const, emailSent: false };
    }

    if (doc.file_path) {
      const { error: removeError } = await supabase.storage
        .from("customer-documents")
        .remove([doc.file_path]);
      if (removeError) {
        throw new Error(`Document storage deletion failed: ${removeError.message}`);
      }
    }

    const deletedAt = new Date().toISOString();
    const reason = data.deletionReason.trim();
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        deleted_at: deletedAt,
        deletion_due_at: null,
        deletion_reason: reason,
        file_path: "",
      })
      .eq("id", data.documentId)
      .is("deleted_at", null);

    if (updateError) throw new Error(updateError.message);

    const profile = doc.profiles as { full_name: string | null; email: string | null } | null;
    const { data: latestBooking } = await supabase
      .from("bookings")
      .select("id, guest_name, guest_email, locale")
      .eq("user_id", doc.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let emailSent = false;
    try {
      const result = await sendLoggedTemplateEmail({
        templateKey: "document_deleted",
        locale: resolveEmailLocale(latestBooking?.locale),
        to: profile?.email ?? latestBooking?.guest_email ?? "",
        input: {
          guestName: profile?.full_name ?? latestBooking?.guest_name,
          bookingRef: latestBooking?.id ? latestBooking.id.slice(0, 8).toUpperCase() : null,
          documentType: documentTypeLabel(doc.document_type),
          deletionReason: reason,
          deletedAt,
          accountUrl: `${BRAND.website}/account/documents`,
        },
        bookingId: latestBooking?.id ?? null,
        documentId: doc.id,
        customerId: doc.user_id,
        idempotencyKey: `document_deleted:customer:${doc.id}:${deletedAt}`,
      });
      emailSent = result.status === "sent";
    } catch (error) {
      console.error("[quickkey.email.document_deleted_failed]", {
        documentId: doc.id,
        message: error instanceof Error ? error.message : "Email failed",
      });
    }

    return { ok: true as const, alreadyDeleted: false as const, emailSent };
  });

export const getAdminSettings = createServerFn({ method: "POST" })
  .inputValidator(adminCtx)
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const supabase = getSupabaseAdminClient();
    const { data: rows, error } = await supabase.from("admin_settings").select("*");
    if (error) throw new Error(error.message);

    const defaults = {
      locations: ["Curaçao International Airport", "Hotel delivery", "Home address"],
      vehicleTypes: ["Toyota Agya", "Toyota Yaris"],
      extras: ["Child seat", "GPS", "Additional driver"],
      insurance: ["Deposit", "Daily coverage"],
      newsletter: { enabled: true },
    };

    const map = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]));
    return { ...defaults, ...map };
  });

export type AdminDiscountStatus = "active" | "scheduled" | "ended";

export type AdminDiscount = PricingDiscountRow & {
  status: AdminDiscountStatus;
  daysLeft: number | null;
  summary: string;
};

export type AdminDiscountPreviewCar = {
  fleetKey: string;
  name: string;
  basePrice: number;
  scope: DiscountScope;
};

function classifyDiscount(d: PricingDiscountRow, now = Date.now()): AdminDiscountStatus {
  const starts = new Date(d.starts_at).getTime();
  const ends = new Date(d.ends_at).getTime();
  if (!d.is_active || now >= ends) return "ended";
  if (now < starts) return "scheduled";
  return "active";
}

function daysUntil(iso: string, now = Date.now()) {
  const target = new Date(iso).getTime();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}

function enrichDiscount(d: PricingDiscountRow): AdminDiscount {
  const status = classifyDiscount(d);
  const now = Date.now();
  const daysLeft =
    status === "active"
      ? daysUntil(d.ends_at, now)
      : status === "scheduled"
        ? daysUntil(d.starts_at, now)
        : null;

  return {
    ...d,
    status,
    daysLeft,
    summary: formatDiscountSummary(d),
  };
}

function buildDiscountSummary(rows: PricingDiscountRow[]) {
  const enriched = rows.map(enrichDiscount);
  const active = enriched.find((d) => d.status === "active") ?? null;
  const scheduled = enriched.filter((d) => d.status === "scheduled");
  return {
    active,
    scheduledCount: scheduled.length,
    nextScheduled: scheduled.sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0] ?? null,
  };
}

export const getAdminDiscounts = createServerFn({ method: "POST" })
  .inputValidator(adminCtx)
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const supabase = getSupabaseAdminClient();

    const [{ data: rows, error }, { data: cars, error: carsError }] = await Promise.all([
      supabase.from("pricing_discounts").select("*").order("starts_at", { ascending: false }),
      supabase.from("cars").select("id, name, image_url, daily_price").eq("is_active", true),
    ]);

    if (error) throw new Error(error.message);
    if (carsError) throw new Error(carsError.message);

    const enriched = ((rows ?? []) as PricingDiscountRow[]).map(enrichDiscount);
    const previewCars: AdminDiscountPreviewCar[] = (cars ?? []).map((car) => ({
      fleetKey: car.image_url ?? "",
      name: car.name,
      basePrice: Number(car.daily_price),
      scope: (car.image_url?.startsWith("agya")
        ? "compact"
        : car.image_url?.startsWith("yaris")
          ? "sedan"
          : "all") as DiscountScope,
    }));

    return {
      active: enriched.filter((d) => d.status === "active"),
      scheduled: enriched.filter((d) => d.status === "scheduled"),
      ended: enriched.filter((d) => d.status === "ended"),
      previewCars,
    };
  });

export const getAdminRewards = createServerFn({ method: "POST" })
  .inputValidator(adminCtx.extend({ email: z.string().email().optional() }))
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const supabase = getSupabaseAdminClient();
    const query = supabase
      .from("reward_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data.email?.trim()) {
      query.eq("customer_email", data.email.trim().toLowerCase());
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const transactions = rows ?? [];
    const balance = transactions
      .filter((row) => row.status === "posted")
      .reduce((sum, row) => sum + Number(row.points_delta), 0);

    return { balance, transactions };
  });

export const createAdminRewardAdjustment = createServerFn({ method: "POST" })
  .inputValidator(
    adminCtx.extend({
      email: z.string().email(),
      points: z.number().int(),
      reason: z.string().trim().min(3).max(240),
      type: z.enum(["admin_adjustment", "historical_credit", "review_bonus"]),
      bookingId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const supabase = getSupabaseAdminClient();
    const email = data.email.trim().toLowerCase();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    const idempotencyKey =
      data.type === "review_bonus" && data.bookingId
        ? `review_bonus:${data.bookingId}:${email}`
        : `${data.type}:${email}:${Date.now()}`;

    const { error } = await supabase.from("reward_transactions").insert({
      customer_id: profile?.id ?? null,
      customer_email: email,
      booking_id: data.bookingId ?? null,
      transaction_type: data.type,
      points_delta: data.points,
      reason: data.reason,
      idempotency_key: idempotencyKey,
      metadata: { source: "admin_portal" },
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });

const createDiscountInput = adminCtx.extend({
  name: z.string().trim().min(1).max(120),
  discountType: z.enum(["percent", "fixed_amount"]),
  discountValue: z.number().positive(),
  scope: z.enum(["all", "compact", "sedan"]),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export const createAdminDiscount = createServerFn({ method: "POST" })
  .inputValidator(createDiscountInput)
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);

    if (new Date(data.endsAt).getTime() <= new Date(data.startsAt).getTime()) {
      throw new Error("End date must be after start date.");
    }

    if (data.discountType === "percent" && data.discountValue > 100) {
      throw new Error("Percent discount cannot exceed 100%.");
    }

    const supabase = getSupabaseAdminClient();
    const { data: hasOverlap, error: overlapError } = await supabase.rpc(
      "pricing_discount_has_overlap",
      {
        p_scope: data.scope,
        p_car_id: null,
        p_starts_at: data.startsAt,
        p_ends_at: data.endsAt,
        p_exclude_id: null,
      },
    );

    if (overlapError) throw new Error(overlapError.message);
    if (hasOverlap) {
      throw new Error(
        "Another discount is already scheduled for this category during these dates. End it first or choose different dates.",
      );
    }

    const { data: row, error } = await supabase
      .from("pricing_discounts")
      .insert({
        name: data.name,
        discount_type: data.discountType as DiscountType,
        discount_value: data.discountValue,
        scope: data.scope as DiscountScope,
        starts_at: data.startsAt,
        ends_at: data.endsAt,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return enrichDiscount(row as PricingDiscountRow);
  });

export const endAdminDiscount = createServerFn({ method: "POST" })
  .inputValidator(adminCtx.extend({ discountId: z.string().uuid() }))
  .handler(async ({ data }) => {
    assertAdminSecret(data.adminSecret);
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    const { data: row, error } = await supabase
      .from("pricing_discounts")
      .update({ is_active: false, ends_at: now, updated_at: now })
      .eq("id", data.discountId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return enrichDiscount(row as PricingDiscountRow);
  });
