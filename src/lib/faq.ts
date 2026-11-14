export const faqKeys = [
  "instant",
  "insured",
  "concierge",
  "support",
  "airport",
  "pristine",
] as const;

export type FaqKey = (typeof faqKeys)[number];

/** Dutch FAQ lists airport pickup before contact. Other locales keep the original order. */
const faqKeysNl = [
  "instant",
  "insured",
  "concierge",
  "airport",
  "support",
  "pristine",
] as const satisfies readonly FaqKey[];

export function faqKeysForLocale(locale: string): readonly FaqKey[] {
  return locale === "nl" ? faqKeysNl : faqKeys;
}

export type FaqItem = {
  question: string;
  answer: string;
};
