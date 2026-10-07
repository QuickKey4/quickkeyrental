import { describe, expect, it } from "vitest";

import { BOOKING_DISABLED_MESSAGE } from "./booking-lock";
import { translateBookError } from "@/i18n/translate-server-error";

describe("booking lock error mapping", () => {
  it("does not hide the booking pause behind a generic failure", () => {
    const errors = {
      generic: "Something went wrong. Please try again.",
      carUnavailable: "That car is no longer available for these dates.",
      bookingDisabled:
        "Online booking is temporarily unavailable. Please contact Quick Key on WhatsApp.",
    };

    expect(translateBookError(BOOKING_DISABLED_MESSAGE, errors)).toBe(errors.bookingDisabled);
  });
});
