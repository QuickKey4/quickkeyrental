import { randomUUID } from "node:crypto";

import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";
import { z } from "zod";

import { assertPublicBookingEnabled } from "@/lib/booking-lock";
import { getServerConfig } from "@/lib/config.server";
import { supportedLocales } from "@/i18n/config";
import { resolveEffectiveDailyPrice } from "@/lib/pricing.server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin.server";

import { confirmBookingPayAtArrival, confirmBookingSentooPayment } from "./booking-confirm.server";
import { assertCarAvailableForPeriod } from "./availability.server";
import { checkoutRequestFingerprint } from "./checkout-security.server";
import {
  amountToSentooCents,
  buildSentooDescription,
  createSentooPaymentWithFallback,
  getSettledSentooTransactionStatus,
  getSentooTransactionStatus,
  isSentooConfigured,
  isSentooStatusFinal,
  isSentooStatusReusable,
  buildSentooReturnUrl,
  cancelSentooTransaction,
  resolveSentooReturnBaseUrl,
  sentooPaymentUrl,
} from "./sentoo.server";

import {
  formatPhoneForStorage,
  isValidLicenseNumber,
  isValidPersonName,
  isValidPersonNamePart,
  isValidPhoneNumber,
  normalizePersonName,
} from "../bookingValidation";
import { calculateBookingTotal, fleetKeyFromCar, rentalDays } from "../bookingUtils";
import { SECURITY_DEPOSIT_AMOUNT } from "../bookingTypes";
import { assertPickupInFutureInCuracao } from "../bookingTime";

const selectedExtraSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  pricePerDay: z.number().min(0),
  quantity: z.number().int().min(0).max(5),
});

const bookingTestCodeSchema = z.string().optional();

const holdInput = z.object({
  bookingTestCode: bookingTestCodeSchema,
  checkoutSessionId: z.string().uuid(),
  carId: z.string().uuid(),
  deliveryType: z.enum(["hotel", "airport", "cruise", "home"]),
  deliveryAddress: z.string().min(3),
  collectionAddress: z.string().min(3),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pickupTime: z.string(),
  returnTime: z.string(),
});

const createBookingInput = z
  .object({
    bookingTestCode: bookingTestCodeSchema,
    bookingId: z.string().uuid().optional(),
    checkoutSessionId: z.string().uuid().optional(),
    carId: z.string().uuid(),
    deliveryType: z.enum(["hotel", "airport", "cruise", "home"]),
    deliveryAddress: z.string().min(3),
    collectionAddress: z.string().min(3),
    pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    pickupTime: z.string(),
    returnTime: z.string(),
    guestFirstName: z.string().min(1),
    guestLastName: z.string().min(1),
    guestName: z.string().min(3),
    guestEmail: z.string().email(),
    guestPhone: z.string().min(8),
    driverDateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    driverLicense: z.string().min(3),
    driverAgeConfirmed: z.literal(true),
    arrivingByPlane: z.boolean(),
    flightNumber: z.string().optional(),
    insuranceOption: z.enum(["deposit", "daily"]),
    selectedExtras: z.array(selectedExtraSchema),
    additionalDriverEnabled: z.boolean().default(false),
    additionalDriverName: z.string().optional(),
    additionalDriverDateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    additionalDriverLicense: z.string().optional(),
    locale: z.enum(supportedLocales).default("en"),
  })
  .superRefine((data, ctx) => {
    if (!isValidPersonNamePart(data.guestFirstName)) {
      ctx.addIssue({ code: "custom", message: "Invalid first name.", path: ["guestFirstName"] });
    }
    if (!isValidPersonNamePart(data.guestLastName)) {
      ctx.addIssue({ code: "custom", message: "Invalid last name.", path: ["guestLastName"] });
    }
    if (!isValidPersonName(data.guestName)) {
      ctx.addIssue({ code: "custom", message: "Invalid guest name.", path: ["guestName"] });
    }
    if (!isValidPhoneNumber(data.guestPhone)) {
      ctx.addIssue({ code: "custom", message: "Invalid phone number.", path: ["guestPhone"] });
    }
    if (!isValidLicenseNumber(data.driverLicense)) {
      ctx.addIssue({ code: "custom", message: "Invalid driver license.", path: ["driverLicense"] });
    }
    if (!isAdultDriverDateOfBirth(data.driverDateOfBirth)) {
      ctx.addIssue({
        code: "custom",
        message: "Driver must be at least 23 years old.",
        path: ["driverDateOfBirth"],
      });
    }
    if (data.arrivingByPlane && !data.flightNumber?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Flight number is required for air arrivals.",
        path: ["flightNumber"],
      });
    }
    if (data.additionalDriverEnabled) {
      if (!data.additionalDriverName || !isValidPersonName(data.additionalDriverName)) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid additional driver name.",
          path: ["additionalDriverName"],
        });
      }
      if (
        !data.additionalDriverDateOfBirth ||
        !isAdultDriverDateOfBirth(data.additionalDriverDateOfBirth)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Additional driver must be at least 23 years old.",
          path: ["additionalDriverDateOfBirth"],
        });
      }
      if (!data.additionalDriverLicense || !isValidLicenseNumber(data.additionalDriverLicense)) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid additional driver license.",
          path: ["additionalDriverLicense"],
        });
      }
    }
  });

const bookingCapabilityInput = z.object({
  bookingTestCode: bookingTestCodeSchema,
  bookingId: z.string().uuid(),
  checkoutSessionId: z.string().uuid(),
});

type BookingRecord = {
  id: string;
  car_id: string;
  checkout_session_id?: string | null;
  guest_email: string;
  pickup_date: string;
  return_date: string;
  subtotal: number;
  extras_total: number;
  total: number;
  insurance_option: "deposit" | "daily";
  deposit_amount: number | null;
  insurance_total: number | null;
  insurance_daily_rate: number | null;
  gas_deposit_amount: number | null;
  payment_status?: string;
  payment_provider?: string;
  pending_expires_at?: string | null;
  expired_at?: string | null;
  sentoo_transaction_id?: string | null;
  sentoo_status?: string | null;
  cars?: { name?: string; daily_price?: number; image_url?: string | null } | null;
};

type HoldRpcResult = {
  bookingId?: string;
  holdExpiresAt?: string;
  reused?: boolean;
};

function isAdultDriverDateOfBirth(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const minBirthDate = new Date();
  minBirthDate.setFullYear(minBirthDate.getFullYear() - 23);
  return date <= minBirthDate;
}

function bookingRef(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function sentooAttemptRef(bookingId: string, requestId: string): string {
  return `${bookingRef(bookingId)}-${requestId.slice(0, 8).toUpperCase()}`;
}

/** Online charge only — security deposit is collected separately at delivery. */
function bookingCheckoutAmount(booking: BookingRecord): number {
  const subtotal = Number(booking.subtotal ?? 0);
  const extras = Number(booking.extras_total ?? 0);
  const insurance = Number(booking.insurance_total ?? 0);
  const payable = subtotal + extras + insurance;

  if (booking.insurance_option === "deposit" && booking.deposit_amount) {
    const legacyTotal = Number(booking.total ?? 0);
    const deposit = Number(booking.deposit_amount);
    if (legacyTotal > payable + 0.01 && Math.abs(legacyTotal - deposit - payable) < 0.02) {
      return payable;
    }
  }

  return payable > 0 ? payable : Number(booking.total ?? 0);
}

async function loadBookingForPayment(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  bookingId: string,
) {
  const booking = await loadBookingRecord(supabase, bookingId);

  if (
    booking.payment_status !== "paid" &&
    booking.pending_expires_at &&
    new Date(booking.pending_expires_at).getTime() <= Date.now()
  ) {
    throw new Error("Your reserved car hold has expired.");
  }

  await assertCarAvailableForPeriod(
    booking.car_id,
    booking.pickup_date,
    booking.return_date,
    booking.id,
  );

  return booking;
}

async function loadBookingRecord(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  bookingId: string,
) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, car_id, checkout_session_id, guest_email, pickup_date, return_date, subtotal, extras_total, total, insurance_option, deposit_amount, insurance_total, insurance_daily_rate, gas_deposit_amount, payment_status, payment_provider, pending_expires_at, expired_at, sentoo_transaction_id, sentoo_status",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const booking = data as BookingRecord | null;
  if (!booking?.id) throw new Error("Booking not found.");
  return booking;
}

function assertCheckoutSession(booking: BookingRecord, checkoutSessionId: string) {
  if (!booking.checkout_session_id || booking.checkout_session_id !== checkoutSessionId) {
    throw new Error("Checkout session does not match this booking.");
  }
}

function publicBookingSummary(booking: BookingRecord) {
  const { checkout_session_id: _checkoutSessionId, ...safeBooking } = booking;
  return safeBooking;
}

export const createCheckoutHold = createServerFn({ method: "POST" })
  .inputValidator(holdInput)
  .handler(async ({ data }) => {
    assertPublicBookingEnabled(data.bookingTestCode);
    assertPickupInFutureInCuracao(data.pickupDate, data.pickupTime);
    const supabase = getSupabaseAdminClient();
    const fingerprintHash = checkoutRequestFingerprint(data.checkoutSessionId);
    const { data: claimId, error: claimError } = await supabase.rpc("claim_checkout_hold_slot", {
      p_fingerprint_hash: fingerprintHash,
      p_checkout_session_id: data.checkoutSessionId,
    });

    if (claimError) throw new Error(claimError.message);
    if (!claimId) throw new Error("Could not reserve this car.");

    try {
      const { data: resultJson, error } = await supabase.rpc("create_checkout_hold", {
        p_checkout_session_id: data.checkoutSessionId,
        p_car_id: data.carId,
        p_pickup_date: data.pickupDate,
        p_return_date: data.returnDate,
        p_pickup_time: data.pickupTime,
        p_return_time: data.returnTime,
        p_delivery_type: data.deliveryType,
        p_delivery_address: data.deliveryAddress,
        p_collection_address: data.collectionAddress,
      });

      if (error) throw new Error(error.message);

      const result = resultJson as HoldRpcResult | null;
      if (!result?.bookingId || !result.holdExpiresAt) {
        throw new Error("Could not reserve this car.");
      }

      await supabase.rpc("complete_checkout_hold_slot", {
        p_claim_id: String(claimId),
        p_fingerprint_hash: fingerprintHash,
        p_checkout_session_id: data.checkoutSessionId,
        p_booking_id: result.bookingId,
        p_expires_at: result.holdExpiresAt,
      });

      return {
        bookingId: result.bookingId,
        holdExpiresAt: result.holdExpiresAt,
        reused: Boolean(result.reused),
      };
    } catch (error) {
      await supabase.rpc("release_checkout_hold_slot", {
        p_claim_id: String(claimId),
        p_fingerprint_hash: fingerprintHash,
        p_checkout_session_id: data.checkoutSessionId,
      });
      throw error;
    }
  });

async function applySentooStatus(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  bookingId: string,
  transactionId: string,
  status: string,
) {
  await supabase.rpc("update_booking_sentoo_status", {
    p_booking_id: bookingId,
    p_status: status,
  });

  if (status === "success") {
    await confirmBookingSentooPayment(bookingId, transactionId);
  }
}

export const createPendingBooking = createServerFn({ method: "POST" })
  .inputValidator(createBookingInput)
  .handler(async ({ data }) => {
    assertPublicBookingEnabled(data.bookingTestCode);
    assertPickupInFutureInCuracao(data.pickupDate, data.pickupTime);
    const supabase = getSupabaseAdminClient();

    const { data: car, error: carError } = await supabase
      .from("cars")
      .select("*")
      .eq("id", data.carId)
      .eq("is_active", true)
      .maybeSingle();

    if (carError) throw new Error(carError.message);
    if (!car) throw new Error("Car not found.");

    await assertCarAvailableForPeriod(data.carId, data.pickupDate, data.returnDate, data.bookingId);

    const pricing = await resolveEffectiveDailyPrice(data.carId);
    const dailyRate = pricing?.effectivePrice ?? Number(car.daily_price);
    const fleetKey = fleetKeyFromCar(car);
    const pricedExtras = data.selectedExtras.filter((extra) => extra.quantity > 0);
    const totals = calculateBookingTotal(
      dailyRate,
      pricedExtras,
      data.pickupDate,
      data.returnDate,
      data.insuranceOption,
      fleetKey,
    );

    const depositAmount = data.insuranceOption === "deposit" ? SECURITY_DEPOSIT_AMOUNT : null;
    const insuranceDailyRate =
      data.insuranceOption === "daily" ? totals.insuranceCharge / Math.max(1, totals.days) : null;
    const insuranceTotal = data.insuranceOption === "daily" ? totals.insuranceCharge : null;
    const guestName = normalizePersonName(data.guestName);
    const guestPhone = formatPhoneForStorage(data.guestPhone);

    const bookingPayload = {
      p_guest_name: guestName,
      p_guest_email: data.guestEmail,
      p_guest_phone: guestPhone,
      p_driver_license: data.driverLicense.trim(),
      p_driver_age_confirmed: data.driverAgeConfirmed,
      p_primary_driver_date_of_birth: data.driverDateOfBirth,
      p_flight_number: data.flightNumber ?? "",
      p_accommodation: "",
      p_subtotal: totals.subtotal,
      p_extras_total: totals.extrasTotal,
      p_total: totals.total,
      p_extras: pricedExtras,
      p_delivery_type: data.deliveryType,
      p_delivery_address: data.deliveryAddress,
      p_collection_address: data.collectionAddress,
      p_insurance_option: data.insuranceOption,
      p_deposit_amount: depositAmount,
      p_insurance_daily_rate: insuranceDailyRate,
      p_insurance_total: insuranceTotal,
      p_gas_deposit_amount: null,
      p_additional_driver_name: data.additionalDriverEnabled
        ? normalizePersonName(data.additionalDriverName ?? "")
        : null,
      p_additional_driver_license: data.additionalDriverEnabled
        ? (data.additionalDriverLicense?.trim() ?? null)
        : null,
      p_additional_driver_date_of_birth: data.additionalDriverEnabled
        ? (data.additionalDriverDateOfBirth ?? null)
        : null,
      p_applied_discount_id: pricing?.discountId ?? null,
      p_priced_daily_rate: dailyRate,
    };

    const { data: bookingId, error: bookingError } =
      data.bookingId && data.checkoutSessionId
        ? await supabase.rpc("finalize_checkout_hold", {
            p_booking_id: data.bookingId,
            p_checkout_session_id: data.checkoutSessionId,
            ...bookingPayload,
          })
        : await supabase.rpc("create_pending_booking", {
            p_car_id: data.carId,
            p_pickup_location: data.deliveryType,
            p_return_location: "collection",
            p_pickup_date: data.pickupDate,
            p_return_date: data.returnDate,
            p_pickup_time: data.pickupTime,
            p_return_time: data.returnTime,
            ...bookingPayload,
          });

    if (bookingError) throw new Error(bookingError.message);
    if (!bookingId) throw new Error("Could not create booking.");

    const { error: localeError } = await supabase
      .from("bookings")
      .update({ locale: data.locale })
      .eq("id", String(bookingId));

    if (localeError) {
      console.error("Could not store booking locale", localeError);
    }

    return {
      bookingId: String(bookingId),
      total: totals.total,
      fleetKey,
    };
  });

function buildStripeLineItems(booking: BookingRecord) {
  const days = rentalDays(booking.pickup_date, booking.return_date);
  const carName = booking.cars?.name ?? "Rental car";
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(Number(booking.subtotal) * 100),
        product_data: {
          name: `${carName} — ${days} day rental`,
          description: `${booking.pickup_date} to ${booking.return_date}`,
        },
      },
    },
  ];

  if (booking.insurance_option === "deposit" && booking.deposit_amount) {
    items.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(Number(booking.deposit_amount) * 100),
        product_data: {
          name: "Refundable security deposit",
          description:
            "Refunded after rental if there is no damage. Refueling charges at return are deducted from this deposit.",
        },
      },
    });
  }

  if (booking.insurance_option === "daily" && booking.insurance_total) {
    items.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(Number(booking.insurance_total) * 100),
        product_data: {
          name: "Full insurance add-on",
          description: `${days} days at $${Number(booking.insurance_daily_rate ?? 0).toFixed(0)}/day`,
        },
      },
    });
  }

  if (Number(booking.extras_total) > 0) {
    items.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(Number(booking.extras_total) * 100),
        product_data: {
          name: "Optional extras",
        },
      },
    });
  }

  return items;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ bookingTestCode: bookingTestCodeSchema, bookingId: z.string().uuid() }),
  )
  .handler(async ({ data }) => {
    assertPublicBookingEnabled(data.bookingTestCode);
    const config = getServerConfig();
    if (!config.stripeSecretKey?.trim()) {
      throw new Error("Stripe is not configured.");
    }

    const supabase = getSupabaseAdminClient();
    const { data: bookingJson, error } = await supabase.rpc("get_booking_by_id", {
      p_booking_id: data.bookingId,
    });

    if (error) throw new Error(error.message);

    const booking = bookingJson as BookingRecord;
    if (!booking?.id) throw new Error("Booking not found.");

    await assertCarAvailableForPeriod(
      booking.car_id,
      booking.pickup_date,
      booking.return_date,
      booking.id,
    );

    const stripe = new Stripe(config.stripeSecretKey);
    const siteUrl = config.siteUrl.replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "usd",
      customer_email: booking.guest_email,
      line_items: buildStripeLineItems(booking),
      metadata: {
        bookingId: booking.id,
        insuranceOption: booking.insurance_option,
      },
      success_url: `${siteUrl}/book?step=confirmation&bookingId=${booking.id}`,
      cancel_url: `${siteUrl}/book?step=payment&bookingId=${booking.id}`,
    });

    if (session.payment_intent && typeof session.payment_intent === "string") {
      await supabase.rpc("set_booking_payment_intent", {
        p_booking_id: booking.id,
        p_payment_intent_id: session.payment_intent,
      });
    }

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");

    return { url: session.url };
  });

export const createSentooCheckout = createServerFn({ method: "POST" })
  .inputValidator(bookingCapabilityInput)
  .handler(async ({ data }) => {
    assertPublicBookingEnabled(data.bookingTestCode);
    if (!isSentooConfigured()) {
      throw new Error("Sentoo is not configured.");
    }

    const siteUrl = resolveSentooReturnBaseUrl().replace(/\/$/, "");

    const supabase = getSupabaseAdminClient();
    const booking = await loadBookingForPayment(supabase, data.bookingId);
    assertCheckoutSession(booking, data.checkoutSessionId);
    const returnUrl = buildSentooReturnUrl(booking.id, data.bookingTestCode);

    if (
      booking.sentoo_transaction_id &&
      isSentooStatusReusable(booking.sentoo_status) &&
      booking.payment_status !== "paid"
    ) {
      const current = await getSettledSentooTransactionStatus(booking.sentoo_transaction_id);
      await supabase.rpc("update_booking_sentoo_status", {
        p_booking_id: booking.id,
        p_status: current.status,
      });

      if (current.status === "success") {
        await confirmBookingSentooPayment(booking.id, booking.sentoo_transaction_id);
        const url = sentooPaymentUrl(booking.sentoo_transaction_id);
        return { url: url ?? `${siteUrl}/book?step=confirmation&bookingId=${booking.id}` };
      }

      if (isSentooStatusReusable(current.status)) {
        const url = sentooPaymentUrl(booking.sentoo_transaction_id);
        if (url) return { url };
      }
    }

    const requestId = randomUUID();
    const { data: claimJson, error: claimError } = await supabase.rpc(
      "claim_booking_sentoo_checkout",
      {
        p_booking_id: booking.id,
        p_checkout_session_id: data.checkoutSessionId,
        p_request_id: requestId,
      },
    );

    if (claimError) throw new Error(claimError.message);
    const claim = claimJson as { claimed?: boolean; inFlight?: boolean; paid?: boolean } | null;
    if (claim?.paid) {
      return { url: `${siteUrl}/book?step=confirmation&bookingId=${booking.id}` };
    }
    if (!claim?.claimed) {
      throw new Error("Payment setup is already in progress. Please wait a moment.");
    }

    let paymentCreated = false;
    try {
      const attemptRef = sentooAttemptRef(booking.id, requestId);
      const payment = await createSentooPaymentWithFallback({
        amountCents: amountToSentooCents(bookingCheckoutAmount(booking)),
        description: buildSentooDescription(attemptRef),
        returnUrl,
        customerRef: attemptRef,
      });
      paymentCreated = true;

      const { error } = await supabase.rpc("complete_booking_sentoo_checkout", {
        p_booking_id: booking.id,
        p_checkout_session_id: data.checkoutSessionId,
        p_request_id: requestId,
        p_transaction_id: payment.transactionId,
        p_status: "issued",
      });

      if (error) throw new Error(error.message);

      return { url: payment.url };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[quickkey.sentoo.checkout_failed]", {
        bookingId: booking.id,
        hasTestCode: Boolean(data.bookingTestCode?.trim()),
        message,
      });

      if (!paymentCreated) {
        await supabase.rpc("release_booking_sentoo_checkout", {
          p_booking_id: booking.id,
          p_checkout_session_id: data.checkoutSessionId,
          p_request_id: requestId,
        });
      }
      throw error;
    }
  });

export const syncSentooPaymentStatus = createServerFn({ method: "POST" })
  .inputValidator(bookingCapabilityInput)
  .handler(async ({ data }) => {
    if (!isSentooConfigured()) {
      throw new Error("Sentoo is not configured.");
    }

    const supabase = getSupabaseAdminClient();
    const booking = await loadBookingRecord(supabase, data.bookingId);
    assertCheckoutSession(booking, data.checkoutSessionId);

    if (!booking.sentoo_transaction_id) {
      return { status: booking.sentoo_status ?? "none", paid: booking.payment_status === "paid" };
    }

    if (booking.payment_status === "paid") {
      return { status: "success", paid: true };
    }

    const current = await getSettledSentooTransactionStatus(booking.sentoo_transaction_id);
    await applySentooStatus(supabase, booking.id, booking.sentoo_transaction_id, current.status);

    const expired =
      current.status !== "success" &&
      booking.payment_status !== "paid" &&
      Boolean(
        booking.pending_expires_at && new Date(booking.pending_expires_at).getTime() <= Date.now(),
      );

    return {
      status: current.status,
      paid: current.status === "success",
      final: isSentooStatusFinal(current.status),
      expired,
      reusable: isSentooStatusReusable(current.status),
    };
  });

export const cancelSentooCheckout = createServerFn({ method: "POST" })
  .inputValidator(bookingCapabilityInput)
  .handler(async ({ data }) => {
    const supabase = getSupabaseAdminClient();
    const booking = await loadBookingRecord(supabase, data.bookingId);
    assertCheckoutSession(booking, data.checkoutSessionId);

    if (!booking.sentoo_transaction_id || booking.payment_status === "paid") {
      return { cancelled: false };
    }

    const current = await getSentooTransactionStatus(booking.sentoo_transaction_id);
    if (isSentooStatusReusable(current.status)) {
      await cancelSentooTransaction(booking.sentoo_transaction_id);
      await supabase.rpc("update_booking_sentoo_status", {
        p_booking_id: booking.id,
        p_status: "cancelled",
      });
      return { cancelled: true };
    }

    await applySentooStatus(supabase, booking.id, booking.sentoo_transaction_id, current.status);
    return { cancelled: current.status === "cancelled" };
  });

export const confirmPayAtArrival = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ bookingTestCode: bookingTestCodeSchema, bookingId: z.string().uuid() }),
  )
  .handler(async ({ data }) => {
    assertPublicBookingEnabled(data.bookingTestCode);
    const supabase = getSupabaseAdminClient();
    const { data: bookingJson, error } = await supabase.rpc("get_booking_by_id", {
      p_booking_id: data.bookingId,
    });

    if (error) throw new Error(error.message);

    const booking = bookingJson as BookingRecord;
    if (!booking?.id) throw new Error("Booking not found.");

    await assertCarAvailableForPeriod(
      booking.car_id,
      booking.pickup_date,
      booking.return_date,
      booking.id,
    );

    await confirmBookingPayAtArrival(booking.id);

    return { ok: true as const };
  });

export const getBookingById = createServerFn({ method: "POST" })
  .inputValidator(bookingCapabilityInput)
  .handler(async ({ data }) => {
    const supabase = getSupabaseAdminClient();
    const { data: booking, error } = await supabase.rpc("get_booking_by_id", {
      p_booking_id: data.bookingId,
    });

    if (error) throw new Error(error.message);
    if (!booking) throw new Error("Booking not found.");
    assertCheckoutSession(booking as BookingRecord, data.checkoutSessionId);
    return publicBookingSummary(booking as BookingRecord);
  });
