import { useI18n } from "@/i18n/provider";
import type { Messages } from "@/i18n/messages";

export type BookingCopy = Messages["book"];

export function useBookingCopy(): BookingCopy {
  const { messages } = useI18n();
  return messages.book;
}
