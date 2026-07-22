import { describe, expect, it } from "vitest";

import { filterAdminBookings, isHiddenAdminCustomer, type AdminBooking } from "./lib/admin-utils";

function booking(input: Partial<AdminBooking> & Pick<AdminBooking, "id">): AdminBooking {
  return {
    accommodation: null,
    additional_driver_license: null,
    additional_driver_date_of_birth: null,
    additional_driver_name: null,
    applied_discount_id: null,
    archive_reason: null,
    archived_at: null,
    archived_by: null,
    car_id: "car-1",
    cancellation_fee: null,
    cancellation_fee_accepted_at: null,
    checkout_session_id: null,
    collection_address: null,
    confirmation_source: null,
    confirmed_at: null,
    created_at: "2026-07-01T10:00:00.000Z",
    delivery_address: null,
    delivery_type: null,
    deposit_amount: null,
    driver_age_confirmed: true,
    driver_license_number: null,
    expired_at: null,
    expiration_reason: null,
    extras_total: 0,
    flight_number: null,
    gas_deposit_amount: null,
    guest_email: "guest@example.com",
    guest_name: "Guest",
    guest_phone: "+5999000000",
    hold_started_at: null,
    id: input.id,
    insurance_daily_rate: null,
    insurance_option: null,
    insurance_total: null,
    locale: "en",
    payment_provider: "sentoo",
    payment_status: "unpaid",
    pending_expires_at: null,
    pickup_date: "2026-07-20",
    pickup_location: "Airport",
    pickup_time: "10:00",
    priced_daily_rate: null,
    primary_driver_date_of_birth: null,
    return_date: "2026-07-24",
    return_location: "Airport",
    return_time: "10:00",
    sentoo_checkout_request_id: null,
    sentoo_checkout_started_at: null,
    sentoo_status: null,
    sentoo_transaction_id: null,
    status: "confirmed",
    stripe_payment_intent_id: null,
    subtotal: 100,
    total: 100,
    user_id: null,
    cars: null,
    ...input,
  };
}

describe("filterAdminBookings", () => {
  it("excludes archived bookings from normal operational filters", () => {
    const visible = booking({ id: "visible" });
    const archived = booking({
      id: "archived",
      archived_at: "2026-07-16T10:00:00.000Z",
      archive_reason: "Old completed test",
    });

    expect(filterAdminBookings([visible, archived], "upcoming", "2026-07-16")).toEqual([visible]);
  });

  it("shows only archived bookings in the archived filter", () => {
    const visible = booking({ id: "visible" });
    const archived = booking({
      id: "archived",
      archived_at: "2026-07-16T10:00:00.000Z",
    });

    expect(filterAdminBookings([visible, archived], "archived", "2026-07-16")).toEqual([archived]);
  });

  it("keeps archived bookings visible in all", () => {
    const visible = booking({ id: "visible", created_at: "2026-07-15T10:00:00.000Z" });
    const archived = booking({
      id: "archived",
      archived_at: "2026-07-16T10:00:00.000Z",
      created_at: "2026-07-16T10:00:00.000Z",
    });

    expect(filterAdminBookings([visible, archived], "all", "2026-07-16")).toEqual([
      archived,
      visible,
    ]);
  });
});

describe("isHiddenAdminCustomer", () => {
  it("hides internal checkout holds and known QA customers from the admin customer list", () => {
    expect(
      isHiddenAdminCustomer(booking({ id: "hold", guest_email: "hold-demo@quickkey.local" })),
    ).toBe(true);
    expect(
      isHiddenAdminCustomer(
        booking({
          id: "edvienne",
          guest_email: "e.c.merencia@live.nl",
          guest_name: "Edvienne Merencia",
        }),
      ),
    ).toBe(true);
    expect(
      isHiddenAdminCustomer(
        booking({ id: "test", guest_email: "test@gmail.com", guest_name: "test test" }),
      ),
    ).toBe(true);
  });

  it("keeps real customers visible", () => {
    expect(
      isHiddenAdminCustomer(
        booking({
          id: "real",
          guest_email: "danicelm@outlook.com",
          guest_name: "Danice Marti",
        }),
      ),
    ).toBe(false);
  });
});
