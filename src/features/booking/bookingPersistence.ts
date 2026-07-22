import type { BookingDraft, BookingStep } from "./bookingTypes";

export const CHECKOUT_SESSION_STORAGE_KEY = "quickkey.checkoutSessionId";
export const CHECKOUT_HOLD_STORAGE_KEY = "quickkey.checkoutHold";
export const CHECKOUT_PROGRESS_STORAGE_KEY = "quickkey.checkoutProgress";

export type StoredCheckoutHold = {
  bookingId?: string;
  holdExpiresAt?: string;
  draft?: Partial<BookingDraft>;
};

export type StoredCheckoutProgress = {
  bookingId?: string;
  step?: BookingStep;
  draft?: Partial<BookingDraft>;
};

export function persistableHoldDraft(draft: BookingDraft): Partial<BookingDraft> {
  return {
    deliveryType: draft.deliveryType,
    pickupDate: draft.pickupDate,
    returnDate: draft.returnDate,
    pickupTime: draft.pickupTime,
    returnTime: draft.returnTime,
    carId: draft.carId,
    fleetKey: draft.fleetKey,
    lockedDailyPrice: draft.lockedDailyPrice,
    insuranceOption: draft.insuranceOption,
    selectedExtras: draft.selectedExtras,
    bookingId: draft.bookingId,
    checkoutSessionId: draft.checkoutSessionId,
    holdExpiresAt: draft.holdExpiresAt,
  };
}

export function recoverableCheckoutStep(
  storedStep: BookingStep | undefined,
  holdActive: boolean,
): BookingStep | null {
  if (!holdActive || !storedStep) return null;
  if (["customer", "extras", "review", "payment"].includes(storedStep)) return storedStep;
  return null;
}

export function shouldResetCheckoutForReviewTest(input: {
  bookingTestCode?: string;
  initialBookingId?: string;
  initialStep: BookingStep;
  searchParams?: {
    car?: string;
    delivery?: string;
    from?: string;
    to?: string;
  };
}): boolean {
  if (!input.bookingTestCode?.trim()) return false;
  if (input.initialBookingId) return false;
  if (input.initialStep !== "dates") return false;

  return true;
}

export function parseStoredValue<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
