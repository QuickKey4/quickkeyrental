import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/account/auth-provider";
import { useI18n } from "@/i18n/provider";
import { translateBookError } from "@/i18n/translate-server-error";
import { useFleet } from "@/hooks/use-fleet";
import {
  normalizePickupDate,
  normalizeReturnDate,
  parseDateKey,
  startOfToday,
  toDateKey,
} from "@/lib/booking";
import type { VehicleKey } from "@/lib/fleet";

import {
  createCheckoutHold,
  createPendingBooking,
  getBookingById,
  syncSentooPaymentStatus,
} from "./api/booking.functions";
import { getCarAvailability } from "./api/availability.functions";
import { isCarAvailableInList } from "./bookingAvailability";
import { stepIndex } from "./bookingCopy";
import {
  CHECKOUT_HOLD_STORAGE_KEY,
  CHECKOUT_PROGRESS_STORAGE_KEY,
  CHECKOUT_SESSION_STORAGE_KEY,
  parseStoredValue,
  persistableHoldDraft,
  recoverableCheckoutStep,
  shouldResetCheckoutForReviewTest,
  type StoredCheckoutHold,
  type StoredCheckoutProgress,
} from "./bookingPersistence";
import { isPickupInFutureInCuracao } from "./bookingTime";
import { BookingConfirmation } from "./BookingConfirmation";
import { useBookingCopy } from "./useBookingCopy";
import { BookingStepCars } from "./BookingStepCars";
import { BookingStepCustomer } from "./BookingStepCustomer";
import { BookingStepDates } from "./BookingStepDates";
import { BookingStepExtras } from "./BookingStepExtras";
import { BookingStepPayment } from "./BookingStepPayment";
import { BookingStepReview } from "./BookingStepReview";
import type { BookingDraft, BookingStep, CarAvailability, SelectedExtra } from "./bookingTypes";
import { defaultDateRange, fleetKeyFromCar } from "./bookingUtils";
import {
  deliveryAddressForType,
  formatPhoneForStorage,
  isValidLicenseNumber,
  isValidPersonNamePart,
  isValidPhoneNumber,
  normalizePersonName,
  resolveDeliveryAddress,
} from "./bookingValidation";
import {
  BookingMobileSummaryBar,
  mobileSummaryPaddingClass,
} from "./components/BookingMobileSummaryBar";
import { BookingProgress } from "./components/BookingProgress";
import { BookingSummary } from "./components/BookingSummary";
import { useBookingAvailability } from "./useBookingAvailability";

const CAR_IDS: Record<VehicleKey, string> = {
  "agya-1": "a1111111-1111-4111-8111-111111111101",
  "agya-2": "a1111111-1111-4111-8111-111111111102",
  "yaris-1": "a1111111-1111-4111-8111-111111111103",
};

function createCheckoutSessionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) =>
    (Number(char) ^ ((Math.random() * 16) >> (Number(char) / 4))).toString(16),
  );
}

function holdHasExpired(holdExpiresAt: string | null) {
  return Boolean(holdExpiresAt && new Date(holdExpiresAt).getTime() <= Date.now());
}

function formatHoldTime(holdExpiresAt: string | null) {
  if (!holdExpiresAt) return "00:00";
  const remaining = Math.max(0, new Date(holdExpiresAt).getTime() - Date.now());
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function holdRemainingMs(holdExpiresAt: string | null) {
  if (!holdExpiresAt) return 0;
  return Math.max(0, new Date(holdExpiresAt).getTime() - Date.now());
}

function formatReservedUntil(holdExpiresAt: string | null, locale = "en-US") {
  if (!holdExpiresAt) return "";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(holdExpiresAt));
}

function composeFullName(firstName: string, lastName: string) {
  return normalizePersonName(`${firstName} ${lastName}`);
}

function splitFullName(fullName: string) {
  const parts = normalizePersonName(fullName).split(" ").filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function bookingDraftPatchFromRecord(
  booking: {
    car_id?: string;
    cars?: CarAvailability["car"] | null;
    pickup_date?: string;
    return_date?: string;
    pickup_time?: string;
    return_time?: string;
    delivery_type?: string | null;
    delivery_address?: string | null;
    collection_address?: string | null;
    priced_daily_rate?: number | null;
    pending_expires_at?: string | null;
    guest_name?: string | null;
    guest_email?: string | null;
    guest_phone?: string | null;
    driver_license_number?: string | null;
    primary_driver_date_of_birth?: string | null;
    driver_age_confirmed?: boolean | null;
    flight_number?: string | null;
    insurance_option?: string | null;
    extras?: SelectedExtra[] | null;
    additional_driver_name?: string | null;
    additional_driver_license?: string | null;
    additional_driver_date_of_birth?: string | null;
  },
  current: BookingDraft,
): Partial<BookingDraft> {
  const name = splitFullName(booking.guest_name ?? "");
  const additionalName = splitFullName(booking.additional_driver_name ?? "");
  const deliveryType =
    booking.delivery_type === "airport" ||
    booking.delivery_type === "cruise" ||
    booking.delivery_type === "home" ||
    booking.delivery_type === "hotel"
      ? booking.delivery_type
      : current.deliveryType;
  const car = booking.cars;

  return {
    carId: booking.car_id ?? current.carId,
    fleetKey:
      car && typeof car === "object" && "image_url" in car
        ? fleetKeyFromCar(car)
        : current.fleetKey,
    lockedDailyPrice:
      Number(booking.priced_daily_rate ?? car?.daily_price) || current.lockedDailyPrice,
    deliveryType,
    deliveryAddress: booking.delivery_address ?? current.deliveryAddress,
    collectionAddress: booking.collection_address ?? current.collectionAddress,
    sameCollectionAddress:
      (booking.delivery_address ?? current.deliveryAddress) ===
      (booking.collection_address ?? current.collectionAddress),
    pickupDate: booking.pickup_date ?? current.pickupDate,
    returnDate: booking.return_date ?? current.returnDate,
    pickupTime: booking.pickup_time?.slice(0, 5) ?? current.pickupTime,
    returnTime: booking.return_time?.slice(0, 5) ?? current.returnTime,
    holdExpiresAt: booking.pending_expires_at ?? current.holdExpiresAt,
    guestFirstName:
      !current.guestFirstName && name.firstName && booking.guest_name !== "Checkout hold"
        ? name.firstName
        : current.guestFirstName,
    guestLastName:
      !current.guestLastName && name.lastName && booking.guest_name !== "Checkout hold"
        ? name.lastName
        : current.guestLastName,
    guestName:
      !current.guestName && booking.guest_name && booking.guest_name !== "Checkout hold"
        ? booking.guest_name
        : current.guestName,
    guestEmail:
      !current.guestEmail && booking.guest_email && !booking.guest_email.endsWith("@quickkey.local")
        ? booking.guest_email
        : current.guestEmail,
    guestPhone:
      !current.guestPhone && booking.guest_phone && booking.guest_phone !== "00000000"
        ? booking.guest_phone
        : current.guestPhone,
    driverLicense: current.driverLicense || booking.driver_license_number || current.driverLicense,
    driverDateOfBirth:
      current.driverDateOfBirth ||
      booking.primary_driver_date_of_birth ||
      current.driverDateOfBirth,
    driverAgeConfirmed:
      current.driverAgeConfirmed || booking.driver_age_confirmed || current.driverAgeConfirmed,
    arrivingByPlane: booking.flight_number?.trim()
      ? true
      : deliveryType === "cruise"
        ? false
        : current.arrivingByPlane,
    flightNumber: booking.flight_number ?? current.flightNumber,
    insuranceOption:
      booking.insurance_option === "deposit" || booking.insurance_option === "daily"
        ? booking.insurance_option
        : current.insuranceOption,
    selectedExtras: Array.isArray(booking.extras) ? booking.extras : current.selectedExtras,
    additionalDriverEnabled:
      Boolean(booking.additional_driver_name) || current.additionalDriverEnabled,
    additionalDriverFirstName: additionalName.firstName || current.additionalDriverFirstName,
    additionalDriverLastName: additionalName.lastName || current.additionalDriverLastName,
    additionalDriverName: booking.additional_driver_name ?? current.additionalDriverName,
    additionalDriverLicense: booking.additional_driver_license ?? current.additionalDriverLicense,
    additionalDriverDateOfBirth:
      booking.additional_driver_date_of_birth ?? current.additionalDriverDateOfBirth,
  };
}

function isValidAdultDriverDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const minBirthDate = new Date();
  minBirthDate.setFullYear(minBirthDate.getFullYear() - 23);
  return date <= minBirthDate;
}

type BookingFlowProps = {
  initialStep?: BookingStep;
  initialBookingId?: string;
  initialAttempt?: string;
  bookingTestCode?: string;
  searchParams?: {
    car?: string;
    delivery?: string;
    from?: string;
    to?: string;
  };
};

export function BookingFlow({
  initialStep = "dates",
  initialBookingId,
  initialAttempt,
  bookingTestCode,
  searchParams,
}: BookingFlowProps) {
  const copy = useBookingCopy();
  const { intlLocale, locale } = useI18n();
  const { user, profile } = useAuth();
  const { fleet } = useFleet();
  const today = useMemo(() => startOfToday(), []);
  const defaults = useMemo(() => defaultDateRange(today), [today]);
  const searchCar = searchParams?.car;
  const searchDelivery = searchParams?.delivery;
  const searchFrom = searchParams?.from;
  const searchTo = searchParams?.to;

  const [step, setStep] = useState<BookingStep>(initialStep);
  const [confirmationPaymentState, setConfirmationPaymentState] = useState<
    "checking" | "confirmed" | "pending" | "failed"
  >(() =>
    initialStep === "confirmation"
      ? "checking"
      : initialAttempt === "pending" || initialAttempt === "issued"
        ? "pending"
        : "confirmed",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState<BookingDraft>(() => {
    const pickupDate = searchParams?.from
      ? toDateKey(normalizePickupDate(parseDateKey(searchParams.from), today))
      : defaults.pickupDate;
    const returnDate = searchParams?.to
      ? toDateKey(
          normalizeReturnDate(parseDateKey(searchParams.to), parseDateKey(pickupDate) ?? today),
        )
      : defaults.returnDate;
    const fleetKey =
      searchParams?.car && fleet.some((vehicle) => vehicle.key === searchParams.car)
        ? (searchParams.car as VehicleKey)
        : null;
    const deliveryType =
      searchParams?.delivery === "airport" ||
      searchParams?.delivery === "cruise" ||
      searchParams?.delivery === "home" ||
      searchParams?.delivery === "hotel"
        ? searchParams.delivery
        : "hotel";
    const initialDeliveryAddress = deliveryAddressForType(deliveryType, "");

    return {
      deliveryType,
      deliveryAddress: initialDeliveryAddress,
      collectionAddress: initialDeliveryAddress,
      sameCollectionAddress: true,
      pickupDate,
      returnDate,
      pickupTime: "10:00",
      returnTime: "10:00",
      carId: fleetKey ? CAR_IDS[fleetKey] : null,
      fleetKey,
      lockedDailyPrice: null,
      guestFirstName: "",
      guestLastName: "",
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      driverDateOfBirth: "",
      driverLicense: "",
      driverAgeConfirmed: false,
      arrivingByPlane: deliveryType === "airport" ? true : deliveryType === "cruise" ? false : null,
      flightNumber: "",
      insuranceOption: null,
      selectedExtras: [],
      additionalDriverEnabled: false,
      additionalDriverFirstName: "",
      additionalDriverLastName: "",
      additionalDriverDateOfBirth: "",
      additionalDriverName: "",
      additionalDriverLicense: "",
      bookingId: initialBookingId ?? null,
      checkoutSessionId: null,
      holdExpiresAt: null,
    };
  });

  const [holdTimeLeft, setHoldTimeLeft] = useState(() => formatHoldTime(draft.holdExpiresAt));

  const availabilityQuery = useBookingAvailability(draft.pickupDate, draft.returnDate);

  const availability = useMemo(() => availabilityQuery.data ?? [], [availabilityQuery.data]);

  const availabilityReady = availabilityQuery.isSuccess && Boolean(availabilityQuery.data);

  const selectedAvailability = availability.find((item) => item.car.id === draft.carId);
  const dailyPrice = selectedAvailability
    ? Number(selectedAvailability.car.daily_price)
    : (draft.lockedDailyPrice ?? 0);
  const holdActive = Boolean(draft.holdExpiresAt && !holdHasExpired(draft.holdExpiresAt));
  const holdUrgent = holdActive && holdRemainingMs(draft.holdExpiresAt) < 5 * 60_000;
  const reservedUntil = formatReservedUntil(draft.holdExpiresAt, intlLocale);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const resetReviewTestState = shouldResetCheckoutForReviewTest({
      bookingTestCode,
      initialBookingId,
      initialStep,
      searchParams: {
        car: searchCar,
        delivery: searchDelivery,
        from: searchFrom,
        to: searchTo,
      },
    });

    if (resetReviewTestState) {
      window.localStorage.removeItem(CHECKOUT_SESSION_STORAGE_KEY);
      window.localStorage.removeItem(CHECKOUT_HOLD_STORAGE_KEY);
      window.sessionStorage.removeItem(CHECKOUT_PROGRESS_STORAGE_KEY);
    }

    const storedSessionId = window.localStorage.getItem(CHECKOUT_SESSION_STORAGE_KEY);
    const parsedSessionId =
      storedSessionId && /^[0-9a-f-]{36}$/i.test(storedSessionId)
        ? storedSessionId
        : createCheckoutSessionId();
    window.localStorage.setItem(CHECKOUT_SESSION_STORAGE_KEY, parsedSessionId);

    const storedHold = resetReviewTestState
      ? null
      : parseStoredValue<StoredCheckoutHold>(
          window.localStorage.getItem(CHECKOUT_HOLD_STORAGE_KEY),
        );
    const storedProgress = resetReviewTestState
      ? null
      : parseStoredValue<StoredCheckoutProgress>(
          window.sessionStorage.getItem(CHECKOUT_PROGRESS_STORAGE_KEY),
        );
    const storedHoldActive = Boolean(
      storedHold?.holdExpiresAt && !holdHasExpired(storedHold.holdExpiresAt),
    );
    const matchingProgress =
      storedHoldActive && storedProgress?.bookingId === storedHold?.bookingId
        ? storedProgress
        : null;

    if (!storedHoldActive) {
      window.localStorage.removeItem(CHECKOUT_HOLD_STORAGE_KEY);
      window.sessionStorage.removeItem(CHECKOUT_PROGRESS_STORAGE_KEY);
    }

    setDraft((current) => ({
      ...current,
      ...(storedHoldActive ? storedHold?.draft : null),
      ...(matchingProgress?.draft ?? null),
      checkoutSessionId: current.checkoutSessionId ?? parsedSessionId,
      bookingId: current.bookingId ?? (storedHoldActive ? (storedHold?.bookingId ?? null) : null),
      holdExpiresAt:
        current.holdExpiresAt ?? (storedHoldActive ? (storedHold?.holdExpiresAt ?? null) : null),
    }));

    const restoredStep = recoverableCheckoutStep(matchingProgress?.step, storedHoldActive);
    if (initialStep === "dates" && !initialBookingId && restoredStep) {
      setStep(restoredStep);
    }
  }, [
    bookingTestCode,
    initialBookingId,
    initialStep,
    searchCar,
    searchDelivery,
    searchFrom,
    searchTo,
  ]);

  useEffect(() => {
    if (!draft.bookingId || !draft.holdExpiresAt || typeof window === "undefined") return;
    window.localStorage.setItem(
      CHECKOUT_HOLD_STORAGE_KEY,
      JSON.stringify({
        bookingId: draft.bookingId,
        holdExpiresAt: draft.holdExpiresAt,
        draft: persistableHoldDraft(draft),
      }),
    );
  }, [draft]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!draft.bookingId || !draft.holdExpiresAt || holdHasExpired(draft.holdExpiresAt)) {
      window.sessionStorage.removeItem(CHECKOUT_PROGRESS_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(
      CHECKOUT_PROGRESS_STORAGE_KEY,
      JSON.stringify({ bookingId: draft.bookingId, step, draft }),
    );
  }, [draft, step]);

  useEffect(() => {
    if (!draft.bookingId || !draft.checkoutSessionId || !draft.holdExpiresAt) return;
    if (holdHasExpired(draft.holdExpiresAt)) return;

    let cancelled = false;
    void getBookingById({
      data: { bookingId: draft.bookingId, checkoutSessionId: draft.checkoutSessionId },
    })
      .then((booking) => {
        if (cancelled) return;
        setDraft((current) => ({
          ...current,
          ...bookingDraftPatchFromRecord(
            booking as Parameters<typeof bookingDraftPatchFromRecord>[0],
            current,
          ),
        }));
      })
      .catch(() => {
        /* keep recovered local draft */
      });

    return () => {
      cancelled = true;
    };
  }, [draft.bookingId, draft.checkoutSessionId, draft.holdExpiresAt]);

  useEffect(() => {
    setHoldTimeLeft(formatHoldTime(draft.holdExpiresAt));
    if (!draft.holdExpiresAt) return;

    const interval = window.setInterval(() => {
      setHoldTimeLeft(formatHoldTime(draft.holdExpiresAt));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [draft.holdExpiresAt]);

  useEffect(() => {
    if (!draft.holdExpiresAt || !holdHasExpired(draft.holdExpiresAt)) return;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CHECKOUT_HOLD_STORAGE_KEY);
      window.sessionStorage.removeItem(CHECKOUT_PROGRESS_STORAGE_KEY);
    }
    setDraft((current) => ({
      ...current,
      bookingId: null,
      holdExpiresAt: null,
      carId: null,
      fleetKey: null,
      lockedDailyPrice: null,
    }));
    if (!["dates", "cars", "confirmation"].includes(step)) {
      setSubmitError(copy.hold.expired);
      setStep("cars");
    }
    void availabilityQuery.refetch();
  }, [availabilityQuery, copy.hold.expired, draft.holdExpiresAt, holdTimeLeft, step]);

  useEffect(() => {
    if (step !== "confirmation" || confirmationPaymentState !== "confirmed") return;
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(CHECKOUT_HOLD_STORAGE_KEY);
    window.sessionStorage.removeItem(CHECKOUT_PROGRESS_STORAGE_KEY);
  }, [confirmationPaymentState, step]);

  useEffect(() => {
    if (!availabilityReady || !draft.carId) return;
    if (draft.bookingId && draft.holdExpiresAt && !holdHasExpired(draft.holdExpiresAt)) return;
    if (!isCarAvailableInList(draft.carId, availability)) {
      setDraft((current) => ({
        ...current,
        carId: null,
        fleetKey: null,
        lockedDailyPrice: null,
      }));
    }
  }, [availability, availabilityReady, draft.bookingId, draft.carId, draft.holdExpiresAt]);

  useEffect(() => {
    if (step !== "confirmation" || !draft.bookingId || !draft.checkoutSessionId) return;

    void getBookingById({
      data: { bookingId: draft.bookingId, checkoutSessionId: draft.checkoutSessionId },
    })
      .then((booking) => {
        setDraft((current) => ({
          ...current,
          ...bookingDraftPatchFromRecord(
            booking as Parameters<typeof bookingDraftPatchFromRecord>[0],
            current,
          ),
        }));
      })
      .catch(() => {
        /* keep local draft */
      });
  }, [draft.bookingId, draft.checkoutSessionId, step]);

  useEffect(() => {
    if (step !== "confirmation" || !draft.bookingId || !draft.checkoutSessionId) return;

    let cancelled = false;
    setConfirmationPaymentState("checking");
    void syncSentooPaymentStatus({
      data: { bookingId: draft.bookingId, checkoutSessionId: draft.checkoutSessionId },
    })
      .then((result) => {
        if (cancelled) return;
        if (result.paid) {
          setConfirmationPaymentState("confirmed");
          return;
        }
        if (result.status === "pending" || result.status === "issued") {
          setConfirmationPaymentState("pending");
          return;
        }
        setConfirmationPaymentState("failed");
      })
      .catch(() => {
        if (!cancelled) setConfirmationPaymentState("failed");
      });

    return () => {
      cancelled = true;
    };
  }, [draft.bookingId, draft.checkoutSessionId, step]);

  useEffect(() => {
    if (bookingTestCode?.trim()) return;
    if (!user && !profile) return;
    const profileName = splitFullName(profile?.full_name?.trim() ?? "");
    setDraft((current) => ({
      ...current,
      guestFirstName: current.guestFirstName || profileName.firstName,
      guestLastName: current.guestLastName || profileName.lastName,
      guestName: current.guestName || profile?.full_name?.trim() || "",
      guestEmail: current.guestEmail || user?.email?.trim() || profile?.email?.trim() || "",
      guestPhone: current.guestPhone || profile?.phone?.trim() || "",
    }));
  }, [bookingTestCode, user, profile]);

  const updateDraft = (patch: Partial<BookingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setErrors({});
    setSubmitError("");
  };

  const focusFirstInvalidField = (fieldName: string) => {
    if (typeof document === "undefined") return;
    window.setTimeout(() => {
      const container = document.querySelector<HTMLElement>(`[data-booking-field="${fieldName}"]`);
      if (!container) return;
      container.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = container.querySelector<HTMLElement>(
        "input, textarea, select, button, [tabindex]:not([tabindex='-1'])",
      );
      focusable?.focus({ preventScroll: true });
    }, 40);
  };

  const validateStep = (current: BookingStep): boolean => {
    const nextErrors: Record<string, string> = {};

    if (current === "dates") {
      const deliveryAddress = resolveDeliveryAddress(draft.deliveryType, draft.deliveryAddress);
      if (!deliveryAddress) {
        nextErrors.deliveryAddress = copy.errors.deliveryAddress;
      }
      const collection = draft.sameCollectionAddress
        ? deliveryAddress
        : draft.collectionAddress.trim();
      if (!collection) {
        nextErrors.collectionAddress = copy.errors.collectionAddress;
      }
      if (!isPickupInFutureInCuracao(draft.pickupDate, draft.pickupTime)) {
        nextErrors.pickupTime = copy.errors.pickupInPast;
      }
    }

    if (current === "cars") {
      if (!availabilityReady) {
        setSubmitError(copy.cars.loadingAvailability);
        return false;
      }
      if (!draft.carId || !selectedAvailability?.available) {
        setSubmitError(copy.errors.selectCar);
        return false;
      }
    }

    if (current === "customer") {
      if (!isValidPersonNamePart(draft.guestFirstName)) {
        nextErrors.guestFirstName = copy.errors.firstName;
      }
      if (!isValidPersonNamePart(draft.guestLastName)) {
        nextErrors.guestLastName = copy.errors.lastName;
      }
      if (!draft.guestEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.guestEmail)) {
        nextErrors.guestEmail = copy.errors.email;
      }
      if (!isValidPhoneNumber(draft.guestPhone)) {
        nextErrors.guestPhone = copy.errors.invalidPhone;
      }
      if (!isValidAdultDriverDate(draft.driverDateOfBirth)) {
        nextErrors.driverDateOfBirth = copy.errors.driverDateOfBirth;
      }
      if (!isValidLicenseNumber(draft.driverLicense)) {
        nextErrors.driverLicense = copy.errors.invalidLicense;
      }
      if (!draft.driverAgeConfirmed) nextErrors.driverAgeConfirmed = copy.errors.age;
      if (draft.arrivingByPlane === null) {
        nextErrors.arrivingByPlane = copy.errors.arrivingByPlane;
      }
      if (draft.arrivingByPlane && !draft.flightNumber.trim()) {
        nextErrors.flightNumber = copy.errors.flightNumber;
      }
    }

    if (current === "extras") {
      if (!draft.insuranceOption) {
        nextErrors.insuranceOption = copy.insurance.required;
      }
      if (draft.additionalDriverEnabled) {
        if (!isValidPersonNamePart(draft.additionalDriverFirstName)) {
          nextErrors.additionalDriverFirstName = copy.errors.additionalDriverFirstName;
        }
        if (!isValidPersonNamePart(draft.additionalDriverLastName)) {
          nextErrors.additionalDriverLastName = copy.errors.additionalDriverLastName;
        }
        if (!isValidAdultDriverDate(draft.additionalDriverDateOfBirth)) {
          nextErrors.additionalDriverDateOfBirth = copy.errors.additionalDriverDateOfBirth;
        }
        if (!isValidLicenseNumber(draft.additionalDriverLicense)) {
          nextErrors.additionalDriverLicense = copy.errors.additionalDriverLicense;
        }
      }
    }

    setErrors(nextErrors);
    const errorFields = Object.keys(nextErrors);
    if (errorFields.length > 0) {
      setSubmitError(copy.errors.requiredFields.replace("{count}", String(errorFields.length)));
      focusFirstInvalidField(errorFields[0]);
      return false;
    }
    setSubmitError("");
    return true;
  };

  const goNext = async () => {
    if (!validateStep(step)) return;

    if (!["dates", "cars", "confirmation"].includes(step) && holdHasExpired(draft.holdExpiresAt)) {
      setSubmitError(copy.hold.expired);
      setStep("cars");
      void availabilityQuery.refetch();
      return;
    }

    if (step === "cars") {
      if (!draft.carId) return;

      setIsSubmitting(true);
      setSubmitError("");
      try {
        const checkoutSessionId = draft.checkoutSessionId ?? createCheckoutSessionId();
        if (typeof window !== "undefined") {
          window.localStorage.setItem(CHECKOUT_SESSION_STORAGE_KEY, checkoutSessionId);
        }

        const deliveryAddress = resolveDeliveryAddress(draft.deliveryType, draft.deliveryAddress);
        const collectionAddress = draft.sameCollectionAddress
          ? deliveryAddress
          : draft.collectionAddress.trim();

        const hold = await createCheckoutHold({
          data: {
            bookingTestCode,
            checkoutSessionId,
            carId: draft.carId,
            deliveryType: draft.deliveryType,
            deliveryAddress,
            collectionAddress,
            pickupDate: draft.pickupDate,
            returnDate: draft.returnDate,
            pickupTime: draft.pickupTime,
            returnTime: draft.returnTime,
          },
        });

        updateDraft({
          checkoutSessionId,
          bookingId: hold.bookingId,
          holdExpiresAt: hold.holdExpiresAt,
        });
        setStep("customer");
      } catch (error) {
        const message = error instanceof Error ? error.message : copy.errors.generic;
        setSubmitError(translateBookError(message, copy.errors));
        void availabilityQuery.refetch();
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (step === "review") {
      if (!draft.insuranceOption || !draft.carId || !draft.bookingId || !draft.checkoutSessionId) {
        setSubmitError(copy.hold.missing);
        setStep("cars");
        return;
      }

      setIsSubmitting(true);
      setSubmitError("");
      try {
        const freshAvailability = await getCarAvailability({
          data: { pickupDate: draft.pickupDate, returnDate: draft.returnDate },
        });

        if (!holdActive && !isCarAvailableInList(draft.carId, freshAvailability)) {
          setSubmitError(copy.errors.carUnavailable);
          setStep("cars");
          return;
        }

        const collectionAddress = draft.sameCollectionAddress
          ? draft.deliveryAddress.trim()
          : draft.collectionAddress.trim();
        const deliveryAddress = resolveDeliveryAddress(draft.deliveryType, draft.deliveryAddress);
        const guestName = composeFullName(draft.guestFirstName, draft.guestLastName);
        const additionalDriverName = composeFullName(
          draft.additionalDriverFirstName,
          draft.additionalDriverLastName,
        );

        const result = await createPendingBooking({
          data: {
            bookingTestCode,
            carId: draft.carId,
            deliveryType: draft.deliveryType,
            deliveryAddress,
            collectionAddress,
            bookingId: draft.bookingId,
            checkoutSessionId: draft.checkoutSessionId,
            pickupDate: draft.pickupDate,
            returnDate: draft.returnDate,
            pickupTime: draft.pickupTime,
            returnTime: draft.returnTime,
            guestFirstName: normalizePersonName(draft.guestFirstName),
            guestLastName: normalizePersonName(draft.guestLastName),
            guestName,
            guestEmail: draft.guestEmail.trim(),
            guestPhone: formatPhoneForStorage(draft.guestPhone),
            driverDateOfBirth: draft.driverDateOfBirth,
            driverLicense: draft.driverLicense.trim(),
            driverAgeConfirmed: true,
            arrivingByPlane: Boolean(draft.arrivingByPlane),
            flightNumber: draft.arrivingByPlane ? draft.flightNumber.trim() : undefined,
            insuranceOption: draft.insuranceOption,
            selectedExtras: draft.selectedExtras,
            additionalDriverEnabled: draft.additionalDriverEnabled,
            additionalDriverName: draft.additionalDriverEnabled ? additionalDriverName : undefined,
            additionalDriverDateOfBirth: draft.additionalDriverEnabled
              ? draft.additionalDriverDateOfBirth
              : undefined,
            additionalDriverLicense: draft.additionalDriverEnabled
              ? draft.additionalDriverLicense.trim()
              : undefined,
            locale,
          },
        });
        updateDraft({ bookingId: result.bookingId, fleetKey: result.fleetKey });
        setStep("payment");
      } catch (error) {
        const message = error instanceof Error ? error.message : copy.errors.generic;
        setSubmitError(translateBookError(message, copy.errors));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const order: BookingStep[] = [
      "dates",
      "cars",
      "customer",
      "extras",
      "review",
      "payment",
      "confirmation",
    ];
    const index = order.indexOf(step);
    if (index >= 0 && index < order.length - 1) {
      setStep(order[index + 1]);
    }
  };

  const goBack = () => {
    const order: BookingStep[] = [
      "dates",
      "cars",
      "customer",
      "extras",
      "review",
      "payment",
      "confirmation",
    ];
    const index = order.indexOf(step);
    if (index > 0) setStep(order[index - 1]);
    setSubmitError("");
  };

  const isCurrentStepReady = (() => {
    if (step === "dates") {
      const deliveryAddress = resolveDeliveryAddress(draft.deliveryType, draft.deliveryAddress);
      const collection = draft.sameCollectionAddress
        ? deliveryAddress
        : draft.collectionAddress.trim();
      return Boolean(
        deliveryAddress &&
        collection &&
        draft.pickupDate &&
        draft.returnDate &&
        isPickupInFutureInCuracao(draft.pickupDate, draft.pickupTime),
      );
    }
    if (step === "cars") {
      return Boolean(availabilityReady && draft.carId && selectedAvailability?.available);
    }
    if (step === "customer") {
      return (
        isValidPersonNamePart(draft.guestFirstName) &&
        isValidPersonNamePart(draft.guestLastName) &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.guestEmail.trim()) &&
        isValidPhoneNumber(draft.guestPhone) &&
        isValidAdultDriverDate(draft.driverDateOfBirth) &&
        isValidLicenseNumber(draft.driverLicense) &&
        draft.driverAgeConfirmed &&
        draft.arrivingByPlane !== null &&
        (!draft.arrivingByPlane || Boolean(draft.flightNumber.trim()))
      );
    }
    if (step === "extras") {
      if (!draft.insuranceOption) return false;
      if (!draft.additionalDriverEnabled) return true;
      return (
        isValidPersonNamePart(draft.additionalDriverFirstName) &&
        isValidPersonNamePart(draft.additionalDriverLastName) &&
        isValidAdultDriverDate(draft.additionalDriverDateOfBirth) &&
        isValidLicenseNumber(draft.additionalDriverLicense)
      );
    }
    if (step === "review") {
      return Boolean(draft.carId && draft.bookingId && draft.checkoutSessionId && holdActive);
    }
    return true;
  })();

  if (step === "confirmation") {
    return (
      <BookingConfirmation
        draft={draft}
        dailyPrice={dailyPrice}
        bookingReference={draft.bookingId ?? "QK-PENDING"}
        payAtArrival={false}
        paymentState={confirmationPaymentState}
        onRetryPayment={() => {
          setConfirmationPaymentState("checking");
          setStep("payment");
          setSubmitError("");
        }}
      />
    );
  }

  return (
    <>
      <BookingProgress
        current={step}
        onStepSelect={(targetStep) => {
          if (stepIndex(targetStep) < stepIndex(step)) {
            setStep(targetStep);
            setSubmitError("");
          }
        }}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div
          className={`rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-md)] transition-all duration-300 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 md:p-8 ${mobileSummaryPaddingClass(step)}`}
        >
          {step !== "dates" && step !== "cars" && draft.holdExpiresAt ? (
            <div
              className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                holdHasExpired(draft.holdExpiresAt)
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : holdUrgent
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-amber-200 bg-amber-50/80 text-amber-950"
              }`}
            >
              <Clock3 className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                {holdHasExpired(draft.holdExpiresAt) ? (
                  <p>{copy.hold.expired}</p>
                ) : holdUrgent ? (
                  <>
                    <p className="font-semibold">{copy.hold.active}</p>
                    <p>{copy.hold.remaining.replace("{time}", holdTimeLeft)}</p>
                    <p className="text-xs opacity-80">
                      {copy.hold.reservedUntil.replace("{time}", reservedUntil)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">{copy.hold.active}</p>
                    <p>{copy.hold.remaining.replace("{time}", holdTimeLeft)}</p>
                    <p className="text-xs opacity-80">
                      {copy.hold.reservedUntil.replace("{time}", reservedUntil)}
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {step === "payment" ? (
            <BookingSummary draft={draft} dailyPrice={dailyPrice} className="mb-6 lg:hidden" />
          ) : null}

          {step === "dates" ? (
            <BookingStepDates draft={draft} onChange={updateDraft} errors={errors} />
          ) : null}
          {step === "cars" ? (
            <BookingStepCars
              availability={availability}
              selectedCarId={draft.carId}
              pickupDate={draft.pickupDate}
              returnDate={draft.returnDate}
              availabilityReady={availabilityReady}
              isLoading={availabilityQuery.isLoading || availabilityQuery.isFetching}
              isError={availabilityQuery.isError}
              onRetry={() => {
                void availabilityQuery.refetch();
              }}
              onSuggestDates={(pickupDate, returnDate) => {
                updateDraft({
                  pickupDate,
                  returnDate,
                  carId: null,
                  fleetKey: null,
                  lockedDailyPrice: null,
                });
              }}
              onSelect={(item) => {
                if (!item.available) return;
                updateDraft({
                  carId: item.car.id,
                  fleetKey: item.fleetKey,
                  lockedDailyPrice: Number(item.car.daily_price),
                });
              }}
            />
          ) : null}
          {step === "customer" ? (
            <BookingStepCustomer draft={draft} onChange={updateDraft} errors={errors} />
          ) : null}
          {step === "extras" ? (
            <BookingStepExtras draft={draft} onChange={updateDraft} errors={errors} />
          ) : null}
          {step === "review" ? (
            <BookingStepReview
              draft={draft}
              dailyPrice={dailyPrice}
              onEdit={(targetStep) => {
                setStep(targetStep);
                setSubmitError("");
              }}
            />
          ) : null}
          {step === "payment" && draft.bookingId && draft.checkoutSessionId ? (
            <BookingStepPayment
              bookingId={draft.bookingId}
              checkoutSessionId={draft.checkoutSessionId}
              bookingTestCode={bookingTestCode}
              initialAttempt={initialAttempt}
              onPaid={() => {
                setConfirmationPaymentState("confirmed");
                setStep("confirmation");
              }}
              onExpired={() => {
                setSubmitError(copy.hold.expired);
                setStep("cars");
                void availabilityQuery.refetch();
              }}
              onReturnToBooking={() => {
                setStep("review");
                setSubmitError("");
              }}
            />
          ) : null}

          {submitError ? <p className="mt-6 text-sm text-destructive">{submitError}</p> : null}

          {step !== "payment" ? (
            <div className="mt-10 flex justify-between gap-3 border-t border-border pt-6">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={goBack}
                disabled={step === "dates"}
                className="glass border-transparent bg-transparent shadow-none hover:bg-black/[0.03]"
              >
                {copy.back}
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={() => void goNext()}
                disabled={isSubmitting}
                aria-disabled={!isCurrentStepReady}
              >
                {step === "cars" && isSubmitting
                  ? copy.hold.reserving
                  : step === "review"
                    ? copy.review.payNow
                    : copy.continue}
              </Button>
            </div>
          ) : null}
        </div>

        {step !== "review" ? (
          <BookingSummary draft={draft} dailyPrice={dailyPrice} className="hidden lg:block" />
        ) : null}
      </div>

      <BookingMobileSummaryBar draft={draft} dailyPrice={dailyPrice} step={step} />
    </>
  );
}
