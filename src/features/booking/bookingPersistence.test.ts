import { describe, expect, it } from "vitest";

import { INITIAL_BOOKING_DRAFT, type BookingDraft } from "./bookingTypes";
import {
  persistableHoldDraft,
  recoverableCheckoutStep,
  shouldResetCheckoutForReviewTest,
} from "./bookingPersistence";

const personalDraft: BookingDraft = {
  ...INITIAL_BOOKING_DRAFT,
  deliveryType: "hotel",
  deliveryAddress: "Private home address",
  collectionAddress: "Private home address",
  pickupDate: "2026-08-01",
  returnDate: "2026-08-08",
  carId: "a1111111-1111-4111-8111-111111111101",
  fleetKey: "agya-1",
  guestFirstName: "Test",
  guestLastName: "Customer",
  guestEmail: "test@example.com",
  guestPhone: "+5999000000",
  driverDateOfBirth: "1990-01-01",
  driverLicense: "CUR-SECRET-1234",
  additionalDriverName: "Second Driver",
  additionalDriverLicense: "CUR-SECRET-5678",
  bookingId: "10000000-1000-4000-8000-100000000001",
  checkoutSessionId: "10000000-1000-4000-8000-100000000002",
  holdExpiresAt: "2026-08-01T12:30:00.000Z",
};

describe("booking persistence", () => {
  it("does not persist customer PII in durable browser storage", () => {
    const stored = persistableHoldDraft(personalDraft);
    const serialized = JSON.stringify(stored);

    expect(serialized).not.toContain("test@example.com");
    expect(serialized).not.toContain("Private home address");
    expect(serialized).not.toContain("CUR-SECRET");
    expect(serialized).not.toContain("1990-01-01");
    expect(stored.carId).toBe(personalDraft.carId);
    expect(stored.pickupDate).toBe(personalDraft.pickupDate);
  });

  it("restores only valid in-progress steps while a hold is active", () => {
    expect(recoverableCheckoutStep("customer", true)).toBe("customer");
    expect(recoverableCheckoutStep("extras", true)).toBe("extras");
    expect(recoverableCheckoutStep("review", true)).toBe("review");
    expect(recoverableCheckoutStep("payment", true)).toBe("payment");
    expect(recoverableCheckoutStep("confirmation", true)).toBeNull();
    expect(recoverableCheckoutStep("review", false)).toBeNull();
  });

  it("starts a fresh isolated session for dedicated review-code test URLs", () => {
    expect(
      shouldResetCheckoutForReviewTest({
        bookingTestCode: "qk-live-test",
        initialStep: "dates",
        searchParams: { delivery: "airport", from: "2026-11-19", to: "2026-11-26" },
      }),
    ).toBe(true);
  });

  it("also starts fresh when the dedicated review-code URL has no date shortcuts", () => {
    expect(
      shouldResetCheckoutForReviewTest({
        bookingTestCode: "qk-live-test",
        initialStep: "dates",
      }),
    ).toBe(true);
  });

  it("does not reset checkout storage for normal customers or confirmation pages", () => {
    expect(
      shouldResetCheckoutForReviewTest({
        initialStep: "dates",
        searchParams: { delivery: "airport", from: "2026-11-19" },
      }),
    ).toBe(false);

    expect(
      shouldResetCheckoutForReviewTest({
        bookingTestCode: "qk-live-test",
        initialStep: "confirmation",
        initialBookingId: "10000000-1000-4000-8000-100000000001",
        searchParams: { delivery: "airport", from: "2026-11-19" },
      }),
    ).toBe(false);
  });
});
