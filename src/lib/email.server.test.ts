import { describe, expect, it } from "vitest";

import type { SupportedLocale } from "@/i18n/config";

import { renderEmailTemplate } from "./email.server";

const locales: SupportedLocale[] = ["en", "nl", "es", "pap", "pt"];

describe("document deletion email", () => {
  it.each(locales)("renders without exposing document contents for %s", (locale) => {
    const rendered = renderEmailTemplate("document_deleted", locale, {
      guestName: "Test Guest",
      bookingRef: "ABC12345",
      documentType: "Driver's license",
      deletedAt: "2026-07-16T12:00:00.000Z",
      deletionReason: "Uploaded in error",
    });

    expect(rendered.subject).toBeTruthy();
    expect(rendered.html).toContain("ABC12345");
    expect(rendered.text).toContain("ABC12345");
    expect(rendered.html).not.toContain("customer-documents");
    expect(rendered.html).not.toContain("signedUrl");
  });
});
