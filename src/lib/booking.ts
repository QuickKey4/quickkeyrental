export type PickupLocationKey = "airport" | "willemstad" | "janThiel" | "punda";

export const PICKUP_LOCATION_KEYS: PickupLocationKey[] = [
  "airport",
  "willemstad",
  "janThiel",
  "punda",
];

export const DEFAULT_PICKUP_DATE = new Date(2026, 4, 20);
export const DEFAULT_RETURN_DATE = new Date(2026, 4, 27);

export function getDefaultPickupDate(reference = startOfToday()): Date {
  return new Date(reference);
}

export function getDefaultReturnDate(pickup: Date): Date {
  return addDays(pickup, 7);
}

export function normalizePickupDate(value: Date | undefined, today = startOfToday()): Date {
  if (!value || value < today) return getDefaultPickupDate(today);
  return value;
}

export function normalizeReturnDate(value: Date | undefined, pickup: Date): Date {
  const minReturn = addDays(pickup, 1);
  if (!value || value < minReturn) return getDefaultReturnDate(pickup);
  return value;
}

export function openDatePicker(input: HTMLInputElement) {
  if (typeof input.showPicker === "function") {
    input.showPicker();
  } else {
    input.focus();
    input.click();
  }
}

export function isPickupLocationKey(value: string | undefined): value is PickupLocationKey {
  return PICKUP_LOCATION_KEYS.includes(value as PickupLocationKey);
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function formatDisplayDate(date: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
