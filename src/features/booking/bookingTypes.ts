import type { Tables } from "@/lib/supabase/database.types";
import type { VehicleKey } from "@/lib/fleet";

export type DbCar = Tables<"cars">;
export type DbExtra = Tables<"extras">;
export type DbBooking = Tables<"bookings">;

export type BookingStep =
  | "dates"
  | "cars"
  | "customer"
  | "driver"
  | "extras"
  | "review"
  | "payment"
  | "confirmation";

export const BOOKING_STEPS: BookingStep[] = [
  "dates",
  "cars",
  "customer",
  "driver",
  "extras",
  "review",
  "payment",
  "confirmation",
];

export type DeliveryType = "hotel" | "airport" | "cruise" | "home";

export type InsuranceOption = "deposit" | "daily";

export type CarAvailability = {
  car: DbCar;
  fleetKey: VehicleKey;
  available: boolean;
  blockedThroughDate: string | null;
  nextAvailableDate: string | null;
  baseDailyPrice: number;
  discountId: string | null;
  discountLabel: string | null;
};

export type SelectedExtra = {
  id: string;
  name: string;
  pricePerDay: number;
  quantity: number;
};

export type BookingDraft = {
  deliveryType: DeliveryType;
  deliveryAddress: string;
  collectionAddress: string;
  sameCollectionAddress: boolean;
  pickupDate: string;
  returnDate: string;
  pickupTime: string;
  returnTime: string;
  carId: string | null;
  fleetKey: VehicleKey | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  driverLicense: string;
  driverAgeConfirmed: boolean;
  flightNumber: string;
  insuranceOption: InsuranceOption | null;
  selectedExtras: SelectedExtra[];
  additionalDriverEnabled: boolean;
  additionalDriverName: string;
  additionalDriverLicense: string;
  bookingId: string | null;
};

export const DEFAULT_PICKUP_TIME = "10:00";
export const DEFAULT_RETURN_TIME = "10:00";

export const SECURITY_DEPOSIT_AMOUNT = 500;

export const ADDITIONAL_DRIVER_EXTRA_ID = "b1111111-1111-4111-8111-111111111103";

export const INITIAL_BOOKING_DRAFT: BookingDraft = {
  deliveryType: "hotel",
  deliveryAddress: "",
  collectionAddress: "",
  sameCollectionAddress: true,
  pickupDate: "",
  returnDate: "",
  pickupTime: DEFAULT_PICKUP_TIME,
  returnTime: DEFAULT_RETURN_TIME,
  carId: null,
  fleetKey: null,
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  driverLicense: "",
  driverAgeConfirmed: false,
  flightNumber: "",
  insuranceOption: null,
  selectedExtras: [],
  additionalDriverEnabled: false,
  additionalDriverName: "",
  additionalDriverLicense: "",
  bookingId: null,
};
