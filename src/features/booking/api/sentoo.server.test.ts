import { describe, expect, it } from "vitest";

import { extractSentooStatus, isSentooStatusFinal, isSentooStatusReusable } from "./sentoo.server";

describe("Sentoo payment recovery states", () => {
  it("reuses only active payment attempts", () => {
    expect(isSentooStatusReusable("issued")).toBe(true);
    expect(isSentooStatusReusable("pending")).toBe(true);
    expect(isSentooStatusReusable("failed")).toBe(false);
    expect(isSentooStatusReusable("cancelled")).toBe(false);
    expect(isSentooStatusReusable("rejected")).toBe(false);
  });

  it("stops recovery for terminal statuses", () => {
    expect(isSentooStatusFinal("success")).toBe(true);
    expect(isSentooStatusFinal("failed")).toBe(true);
    expect(isSentooStatusFinal("rejected")).toBe(true);
    expect(isSentooStatusFinal("expired")).toBe(true);
    expect(isSentooStatusFinal("pending")).toBe(false);
  });

  it("uses nested Sentoo attempt status when the transaction message is still issued", () => {
    expect(
      extractSentooStatus("issued", {
        transaction: { status: "issued" },
        latest_attempt: { status: "rejected" },
      }),
    ).toBe("rejected");
  });

  it("never lets rejected payment remain reusable after a final attempt status is available", () => {
    const status = extractSentooStatus("issued", {
      attempts: [{ status: "rejected" }],
    });

    expect(status).toBe("rejected");
    expect(isSentooStatusFinal(status)).toBe(true);
    expect(isSentooStatusReusable(status)).toBe(false);
  });

  it("lets server-side success override a manipulated failed attempt hint", () => {
    expect(
      extractSentooStatus("success", {
        latest_attempt: { status: "rejected" },
      }),
    ).toBe("success");
  });
});
