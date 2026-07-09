import type { DeliveryType } from "./bookingTypes";

export const HATO_AIRPORT_ADDRESS = "Curaçao International Airport (CUR)";

/** Curaçao's main cruise terminal (Mega Pier), Otrobanda — single port-of-call for cruise ships. */
export const CRUISE_TERMINAL_ADDRESS =
  "Mega Pier Cruise Terminal, Gouverneur van Slobbeweg, Otrobanda, Willemstad, Curaçao";

const LEGACY_HATO_AIRPORT_ADDRESS =
  "Curaçao International Airport (Hato), Plasa Margaret Abraham, Willemstad, Curaçao";

const PERSON_NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '\-][A-Za-zÀ-ÖØ-öø-ÿ]+)+$/;

export function normalizePersonName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidPersonName(value: string): boolean {
  const trimmed = normalizePersonName(value);
  if (trimmed.length < 3) return false;
  if (/\d/.test(trimmed)) return false;
  return PERSON_NAME_PATTERN.test(trimmed);
}

export function sanitizePersonNameInput(value: string): string {
  return value.replace(/[0-9]/g, "");
}

export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidPhoneNumber(value: string): boolean {
  const digits = normalizePhoneDigits(value);
  return digits.length >= 8 && digits.length <= 15;
}

export function formatPhoneForStorage(value: string): string {
  const digits = normalizePhoneDigits(value);
  return digits ? `+${digits}` : "";
}

export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d+\s()-]/g, "");
}

export function isValidLicenseNumber(value: string): boolean {
  const trimmed = value.trim();
  return /^[A-Za-z0-9-]{3,24}$/.test(trimmed);
}

export function fixedDeliveryAddress(type: DeliveryType): string | null {
  if (type === "airport") return HATO_AIRPORT_ADDRESS;
  if (type === "cruise") return CRUISE_TERMINAL_ADDRESS;
  return null;
}

export function isFixedDeliveryType(type: DeliveryType): boolean {
  return fixedDeliveryAddress(type) != null;
}

export function deliveryAddressForType(type: DeliveryType, current: string): string {
  const fixed = fixedDeliveryAddress(type);
  if (fixed) return fixed;
  if (isAirportDeliveryAddress(current) || isCruiseTerminalAddress(current)) return "";
  return current;
}

export function resolveDeliveryAddress(type: DeliveryType, address: string): string {
  const fixed = fixedDeliveryAddress(type);
  if (fixed) return fixed;
  return address.trim();
}

export function isAirportDeliveryAddress(address: string): boolean {
  const trimmed = address.trim();
  return trimmed === HATO_AIRPORT_ADDRESS || trimmed === LEGACY_HATO_AIRPORT_ADDRESS;
}

export function isCruiseTerminalAddress(address: string): boolean {
  return address.trim() === CRUISE_TERMINAL_ADDRESS;
}
