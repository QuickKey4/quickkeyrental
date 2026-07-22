import { useCallback } from "react";

import { useI18n } from "@/i18n/provider";
import { translateAdminError } from "@/i18n/translate-server-error";
import type { AdminMessages } from "@/i18n/messages/admin.en";

import type { FleetStatus, OperationalBookingStatus } from "../lib/admin-utils";

export function useAdminI18n() {
  const { messages, intlLocale } = useI18n();
  const t = messages.admin as AdminMessages;
  const translateError = useCallback(
    (message: string) => translateAdminError(message, t.errors),
    [t.errors],
  );

  return {
    t,
    intlLocale,
    translateError,
  };
}

export function operationalStatusLabel(
  status: OperationalBookingStatus,
  labels: AdminMessages["status"],
): string {
  return labels[status];
}

export function fleetStatusLabel(
  status: FleetStatus,
  labels: AdminMessages["fleetStatus"],
): string {
  return labels[status] ?? status;
}
