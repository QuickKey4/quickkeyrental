import { describe, expect, it } from "vitest";

import { isCarAvailableInList, rentalPeriodsOverlap } from "./bookingAvailability";
import type { CarAvailability } from "./bookingTypes";

describe("three-car availability", () => {
  it("blocks overlapping inclusive rental dates", () => {
    expect(rentalPeriodsOverlap("2026-08-01", "2026-08-07", "2026-08-07", "2026-08-10")).toBe(true);
    expect(rentalPeriodsOverlap("2026-08-01", "2026-08-07", "2026-08-08", "2026-08-10")).toBe(
      false,
    );
  });

  it("only permits selecting a car explicitly returned as available", () => {
    const availability = [
      { car: { id: "agya-1" }, available: false },
      { car: { id: "agya-2" }, available: true },
      { car: { id: "yaris-1" }, available: false },
    ] as unknown as CarAvailability[];

    expect(isCarAvailableInList("agya-1", availability)).toBe(false);
    expect(isCarAvailableInList("agya-2", availability)).toBe(true);
    expect(isCarAvailableInList("missing", availability)).toBe(false);
  });
});
