export const faqKeys = ["instant", "insured", "concierge", "support", "airport", "pristine"] as const;

export type FaqKey = (typeof faqKeys)[number];

export type FaqItem = {
  question: string;
  answer: string;
};
