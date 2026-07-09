import { defaultLocale, supportedLocales, type SupportedLocale } from "@/i18n/config";

function normalizeLanguageTag(tag: string): string {
  return tag.trim().toLowerCase().split("-")[0] ?? "";
}

export function isSupportedLocale(value: string): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}

function collectCandidates(input?: string | string[] | null): string[] {
  if (!input) return [];

  const values = Array.isArray(input) ? input : [input];

  return values
    .flatMap((value) => value.split(","))
    .map((part) => normalizeLanguageTag(part.split(";")[0] ?? ""))
    .filter(Boolean);
}

/** Parse Accept-Language, navigator.language, or navigator.languages. */
export function detectLocale(input?: string | string[] | null): SupportedLocale {
  const candidates = collectCandidates(input);

  for (const candidate of candidates) {
    if (isSupportedLocale(candidate)) return candidate;
  }

  return defaultLocale;
}

/** Prefer the phone/browser language list (iOS/Android set navigator.languages). */
export function detectClientLocale(): SupportedLocale {
  if (typeof navigator === "undefined") return defaultLocale;

  const candidates =
    navigator.languages && navigator.languages.length > 0
      ? [...navigator.languages]
      : [navigator.language];

  return detectLocale(candidates);
}
