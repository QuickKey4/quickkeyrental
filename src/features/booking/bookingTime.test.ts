import { describe, expect, it } from "vitest";

import { curacaoDateTime, isPickupInFutureInCuracao } from "./bookingTime";

describe("Curaçao booking time", () => {
  const now = new Date("2026-07-10T14:00:00.000Z");

  it("uses the Curaçao business timezone", () => {
    expect(curacaoDateTime(now)).toEqual({ date: "2026-07-10", time: "10:00" });
  });

  it("rejects pickup times that have already passed", () => {
    expect(isPickupInFutureInCuracao("2026-07-10", "09:59", now)).toBe(false);
    expect(isPickupInFutureInCuracao("2026-07-10", "10:00", now)).toBe(false);
  });

  it("accepts later same-day and future pickup times", () => {
    expect(isPickupInFutureInCuracao("2026-07-10", "10:01", now)).toBe(true);
    expect(isPickupInFutureInCuracao("2026-07-11", "08:00", now)).toBe(true);
  });
});
