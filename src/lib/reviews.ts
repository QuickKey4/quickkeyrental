export const reviewKeys = ["kayla", "enrique", "alba", "vinny", "luciano"] as const;

export type ReviewKey = (typeof reviewKeys)[number];

export type ReviewCopy = {
  name: string;
  quote: string;
  date: string;
};
