import type { AdminMessages } from "@/i18n/messages/admin.en";

type AdminErrors = AdminMessages["errors"];

export function translateAdminError(message: string, errors: AdminErrors): string {
  const exact: Record<
    string,
    keyof Omit<AdminErrors, "fallback" | "vehicleDisabled" | "vehicleMaintenance">
  > = {
    "Booking not found.": "bookingNotFound",
    "Return date must be on or after pickup date.": "returnDateInvalid",
    "That vehicle is not active and cannot be assigned.": "vehicleNotActive",
    "Customer not found.": "customerNotFound",
    "Document not found.": "documentNotFound",
    "Invalid admin password.": "invalidPassword",
    "Admin portal is not configured. Set QUICKKEY_ADMIN_SECRET.": "notConfigured",
    "End date must be after start date.": "discountEndDateInvalid",
    "Percent discount cannot exceed 100%.": "discountPercentTooHigh",
    "Another discount is already scheduled for this category during these dates. End it first or choose different dates.":
      "discountOverlap",
  };

  const key = exact[message];
  if (key) return errors[key];

  const disabledMatch = message.match(/^(.+) is disabled and cannot be assigned\.$/);
  if (disabledMatch) {
    return errors.vehicleDisabled.replace("{name}", disabledMatch[1]);
  }

  const maintenanceMatch = message.match(/^(.+) is in maintenance and cannot be assigned\.$/);
  if (maintenanceMatch) {
    return errors.vehicleMaintenance.replace("{name}", maintenanceMatch[1]);
  }

  return errors.fallback;
}

type BookErrors = {
  generic: string;
  carUnavailable: string;
  carNotFound?: string;
  couldNotCreateBooking?: string;
  stripeNotConfigured?: string;
  bookingNotFound?: string;
  stripeNoUrl?: string;
  sentooNotConfigured?: string;
  sentooNoUrl?: string;
  holdExpired?: string;
  pickupInPast?: string;
  holdRateLimited?: string;
  paymentInProgress?: string;
};

export function translateBookError(message: string, errors: BookErrors): string {
  const exact: Record<string, keyof BookErrors> = {
    "That car is no longer available for these dates.": "carUnavailable",
    "Car not found.": "carNotFound",
    "Could not create booking.": "couldNotCreateBooking",
    "Stripe is not configured.": "stripeNotConfigured",
    "Booking not found.": "bookingNotFound",
    "Stripe did not return a checkout URL.": "stripeNoUrl",
    "Sentoo is not configured.": "sentooNotConfigured",
    "Sentoo did not return a payment URL.": "sentooNoUrl",
    "Your reserved car hold has expired.": "holdExpired",
    "Pickup time must be in the future in Curacao.": "pickupInPast",
    "Too many active checkout holds. Complete or release an existing hold first.":
      "holdRateLimited",
    "Too many checkout hold attempts. Please wait and try again.": "holdRateLimited",
    "Payment setup is already in progress. Please wait a moment.": "paymentInProgress",
  };

  const key = exact[message];
  if (key && errors[key]) return errors[key] as string;

  if (message.startsWith("Sentoo could not start checkout.") && errors.sentooNoUrl) {
    return errors.sentooNoUrl;
  }

  return errors.generic;
}
