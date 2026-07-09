import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Car,
  Clock,
  Headphones,
  Loader2,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { FleetPhoto } from "@/components/fleet-photo";
import { useFleet } from "@/hooks/use-fleet";
import { useI18n } from "@/i18n/provider";
import { formatDateRange } from "@/i18n/format";
import { getCarAvailability } from "@/features/booking/api/availability.functions";
import type { CarAvailability } from "@/features/booking/bookingTypes";
import { formatPrice } from "@/lib/brand";
import { getVehicle } from "@/lib/fleet";
import type { VehicleKey } from "@/lib/fleet";

import {
  fetchUserBooking,
  updateUserBookingRental,
  type BookingWithCar,
} from "../account-queries";
import { bookingReference, canCancelBooking, canModifyBooking, pickupLocationLabel } from "../account-utils";
import { AccountContent } from "../account-layout";
import { BookingInsuranceSummary } from "../components/booking-insurance-summary";
import {
  AccountCard,
  AccountDetailRow,
  AccountPrimaryButton,
  AccountSecondaryButton,
  AccountSectionTitle,
} from "../components/account-ui";
import { BookingStatusBadge } from "../components/booking-status-badge";
import { CancelBookingDialog } from "../components/cancel-booking-dialog";
import { WhatsAppSupportButton } from "../components/whatsapp-support-button";
import { useCancelBookingFlow } from "../hooks/use-cancel-booking-flow";

type ManageBookingPageProps = {
  bookingId: string;
  editMode?: boolean;
};

export function ManageBookingPage({ bookingId, editMode = false }: ManageBookingPageProps) {
  const { messages, intlLocale } = useI18n();
  const { fleet } = useFleet();
  const navigate = useNavigate();
  const copy = messages.account.manageBooking;

  const [booking, setBooking] = useState<BookingWithCar | null>(null);
  const [editing, setEditing] = useState(editMode);
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [collectionAddress, setCollectionAddress] = useState("");
  const [carId, setCarId] = useState("");
  const [availability, setAvailability] = useState<CarAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const cancelFlow = useCancelBookingFlow(async () => {
    void navigate({ to: "/account/bookings" });
  });

  useEffect(() => {
    setEditing(editMode);
  }, [editMode]);

  useEffect(() => {
    void fetchUserBooking(bookingId)
      .then((data) => {
        if (!data) throw new Error(copy.notFound);
        setBooking(data);
        setPickupDate(data.pickup_date);
        setReturnDate(data.return_date);
        setDeliveryAddress(data.delivery_address ?? pickupLocationLabel(data));
        setCollectionAddress(data.collection_address ?? "");
        setCarId(data.car_id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : copy.loadError))
      .finally(() => setLoading(false));
  }, [bookingId, copy.loadError, copy.notFound]);

  useEffect(() => {
    if (!pickupDate || !returnDate || !editing) return;
    void getCarAvailability({ data: { pickupDate, returnDate } })
      .then((rows) => {
        const merged = rows.map((item) =>
          item.car.id === booking?.car_id ? { ...item, available: true } : item,
        );
        setAvailability(merged);
      })
      .catch(() => setAvailability([]));
  }, [pickupDate, returnDate, booking?.car_id, editing]);

  const modifiable = booking ? canModifyBooking(booking) : false;
  const cancellable = booking ? canCancelBooking(booking) : false;

  const availableCars = useMemo(
    () => availability.filter((item) => item.available || item.car.id === carId),
    [availability, carId],
  );

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!booking) return;

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      await updateUserBookingRental({
        bookingId: booking.id,
        pickupDate,
        returnDate,
        deliveryAddress: deliveryAddress.trim(),
        collectionAddress: collectionAddress.trim(),
        carId,
      });
      const refreshed = await fetchUserBooking(booking.id);
      if (refreshed) setBooking(refreshed);
      setSaved(true);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">{copy.loading}</p>;
  }

  if (!booking) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{error || copy.notFound}</p>
        <Link to="/account/bookings" className="text-sm font-semibold text-[var(--logo-red)]">
          {copy.backToBookings}
        </Link>
      </div>
    );
  }

  const fleetKey = booking.cars?.image_url as VehicleKey | undefined;
  const vehicle = fleetKey ? getVehicle(fleet, fleetKey) : null;
  const dateRange = formatDateRange(intlLocale, booking.pickup_date, booking.return_date);
  const statusKey = booking.status as keyof typeof messages.account.bookings.status;
  const statusLabel = messages.account.bookings.status[statusKey] ?? booking.status;
  const pickupLocation = pickupLocationLabel(booking);
  const returnLocation = booking.collection_address?.trim() || pickupLocation;
  const hasExtras = Number(booking.extras_total) > 0;
  const hasInsurance = Boolean(booking.insurance_option);

  return (
    <AccountContent className="space-y-6">
      <Link
        to="/account/bookings"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-[var(--logo-black)]"
      >
        <ArrowLeft className="size-4" />
        {copy.backToBookings}
      </Link>

      <AccountCard padding="none" className="overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {vehicle ? (
            <FleetPhoto
              src={vehicle.image}
              alt={vehicle.name}
              className="h-48 w-full shrink-0 bg-[#f4f4f2] sm:h-auto sm:w-52 sm:min-h-[200px]"
              imgClassName="p-4"
              fit="contain"
              tint={false}
            />
          ) : (
            <div className="h-48 w-full shrink-0 bg-[#f4f4f2] sm:h-auto sm:w-52" />
          )}
          <div className="flex flex-1 flex-col justify-center p-6 sm:p-8">
            <p className="font-mono text-xs font-medium text-[var(--logo-red)]">
              {messages.account.bookings.ref} · {bookingReference(booking)}
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold text-[var(--logo-black)] sm:text-3xl">
              {booking.cars?.name ?? messages.account.bookings.unknownVehicle}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <BookingStatusBadge label={statusLabel} variant={booking.status} />
              <span className="text-sm text-muted-foreground">{dateRange}</span>
            </div>
            <p className="mt-3 font-display text-2xl font-bold text-[var(--logo-red)]">
              {formatPrice(Number(booking.total), intlLocale)}
            </p>
          </div>
        </div>
      </AccountCard>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{copy.saved}</p>
      ) : null}

      {!modifiable && !editing ? (
        <AccountCard>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.notModifiable}</p>
        </AccountCard>
      ) : null}

      {editing ? (
        <AccountCard>
          <AccountSectionTitle title={copy.changeTitle} />
          <form onSubmit={(event) => void handleSave(event)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={copy.pickupDate}>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(event) => setPickupDate(event.target.value)}
                  required
                  className="field-input"
                />
              </Field>
              <Field label={copy.returnDate}>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(event) => setReturnDate(event.target.value)}
                  required
                  className="field-input"
                />
              </Field>
            </div>

            <Field label={copy.pickupLocation}>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                required
                className="field-input"
              />
            </Field>

            <Field label={copy.dropoffLocation}>
              <input
                type="text"
                value={collectionAddress}
                onChange={(event) => setCollectionAddress(event.target.value)}
                required
                className="field-input"
              />
            </Field>

            <Field label={copy.vehicle}>
              <select
                value={carId}
                onChange={(event) => setCarId(event.target.value)}
                className="field-input"
              >
                {availableCars.map((item) => {
                  const fleetVehicle = fleet.find((v) => v.key === item.fleetKey);
                  return (
                    <option key={item.car.id} value={item.car.id} disabled={!item.available}>
                      {fleetVehicle?.name ?? item.car.name}
                      {!item.available ? ` (${copy.unavailable})` : ""}
                    </option>
                  );
                })}
              </select>
            </Field>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <AccountPrimaryButton
                type="submit"
                disabled={saving}
                className="flex-1"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {copy.save}
              </AccountPrimaryButton>
              <AccountSecondaryButton
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1"
              >
                {copy.cancelEdit}
              </AccountSecondaryButton>
            </div>
          </form>
        </AccountCard>
      ) : (
        <>
          <AccountCard>
            <AccountSectionTitle title={copy.sections.rentalDetails} />
            <div className="divide-y divide-black/[0.05]">
              <AccountDetailRow
                icon={<Car className="size-4" />}
                label={copy.vehicle}
                value={booking.cars?.name ?? messages.account.bookings.unknownVehicle}
              />
              <AccountDetailRow
                icon={<Calendar className="size-4" />}
                label={copy.sections.rentalDetails}
                value={dateRange}
              />
              <AccountDetailRow
                icon={<Clock className="size-4" />}
                label={copy.pickupDate}
                value={`${booking.pickup_time.slice(0, 5)} – ${booking.return_time.slice(0, 5)}`}
              />
            </div>
          </AccountCard>

          <div className="grid gap-4 sm:grid-cols-2">
            <AccountCard>
              <AccountSectionTitle title={copy.sections.pickupDetails} />
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-2 font-semibold text-[var(--logo-black)]">
                  <Calendar className="size-4 text-[var(--logo-red)]" />
                  {booking.pickup_date}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4 text-[var(--logo-red)]" />
                  {booking.pickup_time.slice(0, 5)}
                </p>
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--logo-red)]" />
                  {pickupLocation}
                </p>
              </div>
            </AccountCard>

            <AccountCard>
              <AccountSectionTitle title={copy.sections.returnDetails} />
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-2 font-semibold text-[var(--logo-black)]">
                  <Calendar className="size-4 text-[var(--logo-red)]" />
                  {booking.return_date}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4 text-[var(--logo-red)]" />
                  {booking.return_time.slice(0, 5)}
                </p>
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--logo-red)]" />
                  {returnLocation}
                </p>
              </div>
            </AccountCard>
          </div>

          <AccountCard>
            <AccountSectionTitle title={copy.sections.driverDetails} />
            <div className="divide-y divide-black/[0.05]">
              <AccountDetailRow
                icon={<User className="size-4" />}
                label={copy.driverName}
                value={booking.guest_name}
              />
              <AccountDetailRow
                icon={<Phone className="size-4" />}
                label={copy.driverPhone}
                value={booking.guest_phone}
              />
              {booking.driver_license_number ? (
                <AccountDetailRow
                  label={copy.licenseNumber}
                  value={booking.driver_license_number}
                />
              ) : null}
              {booking.additional_driver_name ? (
                <AccountDetailRow
                  label={copy.additionalDriver}
                  value={booking.additional_driver_name}
                />
              ) : null}
            </div>
          </AccountCard>

          <AccountCard>
            <AccountSectionTitle title={copy.sections.extras} />
            {hasExtras || hasInsurance ? (
              <div className="space-y-4">
                {hasInsurance ? <BookingInsuranceSummary booking={booking} /> : null}
                {hasExtras ? (
                  <AccountDetailRow
                    label={copy.extrasTotal}
                    value={formatPrice(Number(booking.extras_total), intlLocale)}
                  />
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{copy.noExtras}</p>
            )}
          </AccountCard>

          <AccountCard>
            <AccountSectionTitle title={copy.sections.support} />
            <p className="mb-4 text-sm text-muted-foreground">{messages.account.supportPage.subtitle}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <WhatsAppSupportButton className="flex-1 justify-center rounded-xl py-3" />
              <Link
                to="/account/support"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 text-sm font-semibold text-[var(--logo-black)] hover:bg-black/[0.03]"
              >
                <Headphones className="size-4" />
                {messages.account.dashboard.contactUs}
              </Link>
            </div>
          </AccountCard>

          {(modifiable || cancellable) && !editing ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              {modifiable ? (
                <AccountPrimaryButton
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex-1"
                >
                  {messages.account.bookings.actions.manage}
                </AccountPrimaryButton>
              ) : null}
              {cancellable ? (
                <AccountSecondaryButton
                  type="button"
                  disabled={cancelFlow.loading}
                  onClick={() => cancelFlow.requestCancel(booking)}
                  className="flex-1 text-muted-foreground"
                >
                  {cancelFlow.loading ? copy.cancelling : copy.cancelBooking}
                </AccountSecondaryButton>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <CancelBookingDialog
        booking={cancelFlow.target}
        open={cancelFlow.open}
        onOpenChange={cancelFlow.setOpen}
        onConfirm={cancelFlow.confirmCancel}
        loading={cancelFlow.loading}
        error={cancelFlow.error}
      />
    </AccountContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
