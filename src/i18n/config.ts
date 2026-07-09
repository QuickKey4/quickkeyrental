export const supportedLocales = ["en", "es", "nl"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "en";

export const localeLabels: Record<SupportedLocale, string> = {
  en: "English",
  es: "Español",
  nl: "Nederlands",
};

export const localeToIntl: Record<SupportedLocale, string> = {
  en: "en-US",
  es: "es-ES",
  nl: "nl-NL",
};
