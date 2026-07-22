export const BOOKING_DISABLED_MESSAGE =
  "Online booking is temporarily unavailable. Please contact Quick Key on WhatsApp.";

export function isPublicBookingDisabled() {
  const serverValue =
    typeof process !== "undefined"
      ? process.env.QUICKKEY_BOOKING_DISABLED?.trim().toLowerCase()
      : undefined;

  return serverValue === "true" || import.meta.env.VITE_QUICKKEY_BOOKING_DISABLED === "true";
}

export function hasBookingTestCode(value?: string | null) {
  return Boolean(value?.trim());
}

export function isValidBookingTestCode(value?: string | null) {
  if (typeof process === "undefined") return false;

  const expected = process.env.QUICKKEY_BOOKING_TEST_CODE?.trim();
  const candidate = value?.trim();

  return Boolean(expected && candidate && expected === candidate);
}

export function assertPublicBookingEnabled(testCode?: string | null) {
  if (isPublicBookingDisabled() && !isValidBookingTestCode(testCode)) {
    throw new Error(BOOKING_DISABLED_MESSAGE);
  }
}
