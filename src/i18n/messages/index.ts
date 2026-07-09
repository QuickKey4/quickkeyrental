import { defaultLocale, type SupportedLocale } from "@/i18n/config";
import { en, type Messages } from "@/i18n/messages/en";
import { es } from "@/i18n/messages/es";
import { nl } from "@/i18n/messages/nl";

const catalogs: Record<SupportedLocale, Messages> = {
  en,
  es,
  nl,
};

export function getMessages(locale: SupportedLocale): Messages {
  return catalogs[locale] ?? catalogs[defaultLocale];
}

export type { Messages };
