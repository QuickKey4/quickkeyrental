import type { AdminMessages } from "@/i18n/messages/admin.en";

type AdminErrors = AdminMessages["errors"];

export function translateAdminError(message: string, errors: AdminErrors): string {
  const exact: Record<string, keyof Omit<AdminErrors, "fallback" | "vehicleDisabled" | "vehicleMaintenance">> =
    {
      "Booking not found.": "bookingNotFound",
      "Return date must be on or after pickup date.": "returnDateInvalid",
      "That vehicle is not active and cannot be assigned.": "vehicleNotActive",
      "Customer not found.": "customerNotFound",
      "Document not found.": "documentNotFound",
      "Invalid admin password.": "invalidPassword",
      "Admin portal is not configured. Set QUICKKEY_ADMIN_SECRET.": "notConfigured",
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
  };

  const key = exact[message];
  if (key && errors[key]) return errors[key] as string;

  if (message.startsWith("Sentoo") || message.includes("sentoo")) {
    return message;
  }

  if (message.length > 0 && message.length <= 180 && !message.includes(" at ")) {
    return message;
  }

  return errors.generic;
}
