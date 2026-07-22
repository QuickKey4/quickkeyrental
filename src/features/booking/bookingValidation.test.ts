import { describe, expect, it } from "vitest";

import { maskLicenseNumber } from "./bookingValidation";

describe("licence privacy", () => {
  it("masks all but the final four characters", () => {
    expect(maskLicenseNumber("CUR-SECRET-1234")).toBe("***********1234");
  });

  it("keeps short values readable", () => {
    expect(maskLicenseNumber("1234")).toBe("1234");
  });
});
