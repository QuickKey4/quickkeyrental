import { describe, expect, it } from "vitest";

import { calculateBookingTotal } from "./bookingUtils";

describe("server-aligned booking totals", () => {
  it("prices rental, insurance and extras without charging the security deposit online", () => {
    const totals = calculateBookingTotal(
      45,
      [{ id: "extra", name: "Child seat", pricePerDay: 5, quantity: 1 }],
      "2026-08-01",
      "2026-08-08",
      "daily",
      "agya-1",
    );

    expect(totals.days).toBe(7);
    expect(totals.subtotal).toBe(315);
    expect(totals.insuranceCharge).toBe(210);
    expect(totals.extrasTotal).toBe(35);
    expect(totals.total).toBe(560);
    expect(totals.securityDeposit).toBe(0);
  });

  it("shows but does not add the security deposit to the online total", () => {
    const totals = calculateBookingTotal(45, [], "2026-08-01", "2026-08-08", "deposit", "agya-1");

    expect(totals.total).toBe(315);
    expect(totals.securityDeposit).toBe(500);
  });
});
