import { addDays, getDefaultPickupDate, getDefaultReturnDate, toDateKey } from "@/lib/booking";
import type { VehicleKey } from "@/lib/fleet";

import { rentalPeriodsOverlap } from "./bookingAvailability";
import {
  SECURITY_DEPOSIT_AMOUNT,
  type DbCar,
  type InsuranceOption,
  type SelectedExtra,
} from "./bookingTypes";

const FLEET_KEYS: VehicleKey[] = ["agya-1", "agya-2", "yaris-1"];

export function fleetKeyFromCar(car: DbCar): VehicleKey {
  const slug = car.image_url;
  if (slug && FLEET_KEYS.includes(slug as VehicleKey)) {
    return slug as VehicleKey;
  }
  return "agya-1";
}

export function rentalDays(pickupDate: string, returnDate: string): number {
  const pickup = new Date(`${pickupDate}T00:00:00`);
  const returnDay = new Date(`${returnDate}T00:00:00`);
  const diff = Math.round((returnDay.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

export function dailyInsuranceRate(fleetKey: VehicleKey | null): number {
  if (fleetKey === "yaris-1") return 13;
  return 10;
}

export function calculateSubtotal(dailyPrice: number, pickupDate: string, returnDate: string) {
  return dailyPrice * rentalDays(pickupDate, returnDate);
}

export function calculateExtrasTotal(extras: SelectedExtra[], pickupDate: string, returnDate: string) {
  const days = rentalDays(pickupDate, returnDate);
  return extras.reduce((sum, extra) => sum + extra.pricePerDay * extra.quantity * days, 0);
}

export function calculateInsuranceCharge(
  insuranceOption: InsuranceOption | null,
  fleetKey: VehicleKey | null,
  pickupDate: string,
  returnDate: string,
) {
  if (insuranceOption !== "daily") return 0;
  return dailyInsuranceRate(fleetKey) * rentalDays(pickupDate, returnDate);
}

export function calculateSecurityDeposit(insuranceOption: InsuranceOption | null): number {
  if (insuranceOption !== "deposit") return 0;
  return SECURITY_DEPOSIT_AMOUNT;
}

export function calculateBookingTotal(
  dailyPrice: number,
  extras: SelectedExtra[],
  pickupDate: string,
  returnDate: string,
  insuranceOption: InsuranceOption | null,
  fleetKey: VehicleKey | null,
) {
  const days = rentalDays(pickupDate, returnDate);
  const subtotal = calculateSubtotal(dailyPrice, pickupDate, returnDate);
  const extrasTotal = calculateExtrasTotal(extras, pickupDate, returnDate);
  const insuranceCharge = calculateInsuranceCharge(insuranceOption, fleetKey, pickupDate, returnDate);
  const securityDeposit = calculateSecurityDeposit(insuranceOption);
  const total = subtotal + extrasTotal + insuranceCharge;
  return {
    days,
    subtotal,
    extrasTotal,
    insuranceCharge,
    securityDeposit,
    total,
  };
}

/** Amount charged online (rental + extras + daily insurance only — never the security deposit). */
export function calculateCheckoutTotal(
  dailyPrice: number,
  extras: SelectedExtra[],
  pickupDate: string,
  returnDate: string,
  insuranceOption: InsuranceOption | null,
  fleetKey: VehicleKey | null,
): number {
  return calculateBookingTotal(
    dailyPrice,
    extras,
    pickupDate,
    returnDate,
    insuranceOption,
    fleetKey,
  ).total;
}

export function defaultDateRange(today = new Date()) {
  const pickup = getDefaultPickupDate(today);
  const returnDate = getDefaultReturnDate(pickup);
  return { pickupDate: toDateKey(pickup), returnDate: toDateKey(returnDate) };
}

export function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return rentalPeriodsOverlap(aStart, aEnd, bStart, bEnd);
}

export { rentalPeriodsOverlap } from "./bookingAvailability";

export function sortCarsByFleetOrder<T extends { fleetKey: VehicleKey }>(cars: T[]): T[] {
  const order = new Map(FLEET_KEYS.map((key, index) => [key, index]));
  return [...cars].sort(
    (left, right) => (order.get(left.fleetKey) ?? 99) - (order.get(right.fleetKey) ?? 99),
  );
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return toDateKey(addDays(new Date(year, month - 1, day), days));
}
