import { describe, expect, it } from "vitest";

import { createDateRangePatch } from "./bookingDateRange";

const today = new Date(2026, 6, 15);

describe("booking date range selection", () => {
  it("persists pickup and return dates from a completed range", () => {
    expect(
      createDateRangePatch({
        today,
        currentReturnDate: "2026-08-17",
        range: {
          from: new Date(2026, 7, 10),
          to: new Date(2026, 7, 18),
        },
      }),
    ).toMatchObject({
      pickupDate: "2026-08-10",
      returnDate: "2026-08-18",
    });
  });

  it("keeps a valid existing return date while choosing a new pickup date", () => {
    expect(
      createDateRangePatch({
        today,
        currentReturnDate: "2026-08-17",
        range: {
          from: new Date(2026, 7, 12),
        },
      }),
    ).toMatchObject({
      pickupDate: "2026-08-12",
      returnDate: "2026-08-17",
    });
  });

  it("normalizes stale return dates and clears selected downstream booking data", () => {
    expect(
      createDateRangePatch({
        today,
        currentReturnDate: "2026-08-10",
        range: {
          from: new Date(2026, 7, 12),
        },
      }),
    ).toMatchObject({
      pickupDate: "2026-08-12",
      returnDate: "2026-08-19",
      carId: null,
      fleetKey: null,
      lockedDailyPrice: null,
    });
  });

  it("ignores empty range updates", () => {
    expect(
      createDateRangePatch({
        today,
        currentReturnDate: "2026-08-17",
        range: undefined,
      }),
    ).toBeNull();
  });
});
