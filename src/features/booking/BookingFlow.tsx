import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/account/auth-provider";
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

import { createPendingBooking, getBookingById, syncSentooPaymentStatus } from "./api/booking.functions";
import { getCarAvailability } from "./api/availability.functions";
import { isCarAvailableInList } from "./bookingAvailability";
import { BookingConfirmation } from "./BookingConfirmation";
import { useBookingCopy } from "./useBookingCopy";
import { BookingStepCars } from "./BookingStepCars";
import { BookingStepCustomer } from "./BookingStepCustomer";
import { BookingStepDates } from "./BookingStepDates";
import { BookingStepDriver } from "./BookingStepDriver";
import { BookingStepExtras } from "./BookingStepExtras";
import { BookingStepPayment } from "./BookingStepPayment";
import { BookingStepReview } from "./BookingStepReview";
import type { BookingDraft, BookingStep, CarAvailability } from "./bookingTypes";
import { defaultDateRange, fleetKeyFromCar } from "./bookingUtils";
import {
  deliveryAddressForType,
  formatPhoneForStorage,
  isValidLicenseNumber,
  isValidPersonName,
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

type BookingFlowProps = {
  initialStep?: BookingStep;
  initialBookingId?: string;
  initialAttempt?: string;
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
  searchParams,
}: BookingFlowProps) {
  const copy = useBookingCopy();
  const { user, profile } = useAuth();
  const { fleet } = useFleet();
  const today = useMemo(() => startOfToday(), []);
  const defaults = useMemo(() => defaultDateRange(today), [today]);

  const [step, setStep] = useState<BookingStep>(initialStep);
  const [paymentPending, setPaymentPending] = useState(
    () => initialAttempt === "pending" || initialAttempt === "issued",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState<BookingDraft>(() => {
    const pickupDate = searchParams?.from
      ? toDateKey(normalizePickupDate(parseDateKey(searchParams.from), today))
      : defaults.pickupDate;
    const returnDate = searchParams?.to
      ? toDateKey(normalizeReturnDate(parseDateKey(searchParams.to), parseDateKey(pickupDate) ?? today))
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
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      driverLicense: "",
      driverAgeConfirmed: false,
      flightNumber: "",
      insuranceOption: null,
      selectedExtras: [],
      additionalDriverEnabled: false,
      additionalDriverName: "",
      additionalDriverLicense: "",
      bookingId: initialBookingId ?? null,
    };
  });

  const availabilityQuery = useBookingAvailability(draft.pickupDate, draft.returnDate);

  const fallbackAvailability = useMemo<CarAvailability[]>(
    () =>
      fleet.map((vehicle) => ({
        car: {
          id: CAR_IDS[vehicle.key],
          name: vehicle.name,
          category: vehicle.category,
          year: vehicle.detail.year,
          daily_price: vehicle.price,
          seats: vehicle.seats,
          bags: 2,
          transmission: vehicle.transmission,
          fuel_type: vehicle.fuel,
          ac: true,
          image_url: vehicle.key,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        fleetKey: vehicle.key,
        available: true,
        blockedThroughDate: null,
        nextAvailableDate: null,
      })),
    [fleet],
  );

  const availability = useMemo(() => {
    if (availabilityQuery.data) {
      return availabilityQuery.data;
    }

    return fallbackAvailability;
  }, [availabilityQuery.data, fallbackAvailability]);

  const availabilityReady = availabilityQuery.isSuccess && Boolean(availabilityQuery.data);

  const selectedAvailability = availability.find((item) => item.car.id === draft.carId);
  const dailyPrice = selectedAvailability ? Number(selectedAvailability.car.daily_price) : 0;

  useEffect(() => {
    if (!availabilityReady || !draft.carId) return;
    if (!isCarAvailableInList(draft.carId, availability)) {
      setDraft((current) => ({ ...current, carId: null, fleetKey: null }));
    }
  }, [availability, availabilityReady, draft.carId]);

  useEffect(() => {
    if (step !== "confirmation" || !draft.bookingId) return;

    void getBookingById({ data: { bookingId: draft.bookingId } })
      .then((booking) => {
        const car = booking.cars;
        if (car && typeof car === "object" && "image_url" in car) {
          setDraft((current) => ({
            ...current,
            fleetKey: fleetKeyFromCar(car as CarAvailability["car"]),
            deliveryType:
              booking.delivery_type === "airport" ||
              booking.delivery_type === "cruise" ||
              booking.delivery_type === "home" ||
              booking.delivery_type === "hotel"
                ? booking.delivery_type
                : current.deliveryType,
            deliveryAddress: booking.delivery_address ?? current.deliveryAddress,
            collectionAddress: booking.collection_address ?? current.collectionAddress,
            sameCollectionAddress:
              (booking.delivery_address ?? "") === (booking.collection_address ?? ""),
            pickupDate: booking.pickup_date,
            returnDate: booking.return_date,
            pickupTime: booking.pickup_time.slice(0, 5),
            returnTime: booking.return_time.slice(0, 5),
            guestName: booking.guest_name,
            guestEmail: booking.guest_email,
            guestPhone: booking.guest_phone,
            insuranceOption:
              booking.insurance_option === "deposit" || booking.insurance_option === "daily"
                ? booking.insurance_option
                : current.insuranceOption,
          }));
        }
      })
      .catch(() => {
        /* keep local draft */
      });
  }, [draft.bookingId, step]);

  useEffect(() => {
    if (step !== "confirmation" || !draft.bookingId || !initialAttempt) return;

    let cancelled = false;
    void syncSentooPaymentStatus({ data: { bookingId: draft.bookingId } })
      .then((result) => {
        if (cancelled) return;
        if (result.paid) {
          setPaymentPending(false);
          return;
        }
        if (
          result.status === "pending" ||
          result.status === "issued" ||
          initialAttempt === "pending" ||
          initialAttempt === "issued"
        ) {
          setPaymentPending(true);
        }
      })
      .catch(() => {
        /* webhook may confirm shortly */
      });

    return () => {
      cancelled = true;
    };
  }, [draft.bookingId, initialAttempt, step]);

  useEffect(() => {
    if (!user && !profile) return;
    setDraft((current) => ({
      ...current,
      guestName: profile?.full_name?.trim() || current.guestName,
      guestEmail: user?.email?.trim() || profile?.email?.trim() || current.guestEmail,
      guestPhone: profile?.phone?.trim() || current.guestPhone,
    }));
  }, [user, profile]);

  const updateDraft = (patch: Partial<BookingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setErrors({});
    setSubmitError("");
  };

  const validateStep = (current: BookingStep): boolean => {
    const nextErrors: Record<string, string> = {};

    if (current === "dates") {
      const deliveryAddress = resolveDeliveryAddress(draft.deliveryType, draft.deliveryAddress);
      if (!deliveryAddress) {
        nextErrors.deliveryAddress = copy.errors.deliveryAddress;
      }
      const collection = draft.sameCollectionAddress ? deliveryAddress : draft.collectionAddress.trim();
      if (!collection) {
        nextErrors.collectionAddress = copy.errors.collectionAddress;
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
      if (!isValidPersonName(draft.guestName)) {
        nextErrors.guestName = copy.errors.invalidName;
      }
      if (!draft.guestEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.guestEmail)) {
        nextErrors.guestEmail = copy.errors.email;
      }
      if (!isValidPhoneNumber(draft.guestPhone)) {
        nextErrors.guestPhone = copy.errors.invalidPhone;
      }
    }

    if (current === "driver") {
      if (!isValidLicenseNumber(draft.driverLicense)) {
        nextErrors.driverLicense = copy.errors.invalidLicense;
      }
      if (!draft.driverAgeConfirmed) nextErrors.driverAgeConfirmed = copy.errors.age;
    }

    if (current === "extras") {
      if (!draft.insuranceOption) {
        nextErrors.insuranceOption = copy.insurance.required;
      }
      if (draft.additionalDriverEnabled) {
        if (!isValidPersonName(draft.additionalDriverName)) {
          nextErrors.additionalDriverName = copy.errors.additionalDriverName;
        }
        if (!isValidLicenseNumber(draft.additionalDriverLicense)) {
          nextErrors.additionalDriverLicense = copy.errors.additionalDriverLicense;
        }
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = async () => {
    if (!validateStep(step)) return;

    if (step === "review") {
      if (!draft.insuranceOption || !draft.carId) return;

      setIsSubmitting(true);
      setSubmitError("");
      try {
        const freshAvailability = await getCarAvailability({
          data: { pickupDate: draft.pickupDate, returnDate: draft.returnDate },
        });

        if (!isCarAvailableInList(draft.carId, freshAvailability)) {
          setSubmitError(copy.errors.carUnavailable);
          setStep("cars");
          return;
        }

        const collectionAddress = draft.sameCollectionAddress
          ? draft.deliveryAddress.trim()
          : draft.collectionAddress.trim();
        const deliveryAddress = resolveDeliveryAddress(draft.deliveryType, draft.deliveryAddress);

        const result = await createPendingBooking({
          data: {
            carId: draft.carId,
            deliveryType: draft.deliveryType,
            deliveryAddress,
            collectionAddress,
            pickupDate: draft.pickupDate,
            returnDate: draft.returnDate,
            pickupTime: draft.pickupTime,
            returnTime: draft.returnTime,
            guestName: normalizePersonName(draft.guestName),
            guestEmail: draft.guestEmail.trim(),
            guestPhone: formatPhoneForStorage(draft.guestPhone),
            driverLicense: draft.driverLicense.trim(),
            driverAgeConfirmed: true,
            flightNumber: draft.flightNumber.trim() || undefined,
            insuranceOption: draft.insuranceOption,
            selectedExtras: draft.selectedExtras,
            additionalDriverEnabled: draft.additionalDriverEnabled,
            additionalDriverName: draft.additionalDriverEnabled
              ? normalizePersonName(draft.additionalDriverName)
              : undefined,
            additionalDriverLicense: draft.additionalDriverEnabled
              ? draft.additionalDriverLicense.trim()
              : undefined,
            userId: user?.id,
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
      "driver",
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
      "driver",
      "extras",
      "review",
      "payment",
      "confirmation",
    ];
    const index = order.indexOf(step);
    if (index > 0) setStep(order[index - 1]);
    setSubmitError("");
  };

  if (step === "confirmation") {
    return (
      <BookingConfirmation
        draft={draft}
        dailyPrice={dailyPrice}
        bookingReference={draft.bookingId ?? "QK-PENDING"}
        payAtArrival={false}
        paymentPending={paymentPending}
      />
    );
  }

  return (
    <>
      <BookingProgress current={step} />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div
          className={`rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-md)] md:p-8 ${mobileSummaryPaddingClass(step)}`}
        >
          {step === "payment" ? (
            <BookingSummary
              draft={draft}
              dailyPrice={dailyPrice}
              className="mb-6 lg:hidden"
            />
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
              onSuggestDates={(pickupDate, returnDate) => {
                updateDraft({ pickupDate, returnDate, carId: null, fleetKey: null });
              }}
              onSelect={(item) => {
                if (!item.available) return;
                updateDraft({ carId: item.car.id, fleetKey: item.fleetKey });
              }}
            />
          ) : null}
          {step === "customer" ? (
            <BookingStepCustomer draft={draft} onChange={updateDraft} errors={errors} />
          ) : null}
          {step === "driver" ? (
            <BookingStepDriver draft={draft} onChange={updateDraft} errors={errors} />
          ) : null}
          {step === "extras" ? (
            <BookingStepExtras draft={draft} onChange={updateDraft} errors={errors} />
          ) : null}
          {step === "review" ? <BookingStepReview draft={draft} dailyPrice={dailyPrice} /> : null}
          {step === "payment" && draft.bookingId ? (
            <BookingStepPayment bookingId={draft.bookingId} />
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
              <Button type="button" size="lg" onClick={() => void goNext()} disabled={isSubmitting}>
                {step === "review" ? copy.review.payNow : copy.continue}
              </Button>
            </div>
          ) : null}
        </div>

        <BookingSummary
          draft={draft}
          dailyPrice={dailyPrice}
          className="hidden lg:block"
        />
      </div>

      <BookingMobileSummaryBar draft={draft} dailyPrice={dailyPrice} step={step} />
    </>
  );
}
