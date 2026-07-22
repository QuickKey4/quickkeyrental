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
import { getBookingExtras } from "@/features/booking/api/availability.functions";
import { formatPrice } from "@/lib/brand";
import { getVehicle } from "@/lib/fleet";
import type { VehicleKey } from "@/lib/fleet";

import { fetchUserBooking, updateUserBookingRental, type BookingWithCar } from "../account-queries";
import {
  bookingReference,
  canCancelBooking,
  canModifyBooking,
  formatAccountDate,
  maskLicenseNumber,
  pickupLocationLabel,
} from "../account-utils";
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
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [collectionAddress, setCollectionAddress] = useState("");
  const [additionalDriverName, setAdditionalDriverName] = useState("");
  const [additionalDriverLicense, setAdditionalDriverLicense] = useState("");
  const [availableExtras, setAvailableExtras] = useState<
    Awaited<ReturnType<typeof getBookingExtras>>
  >([]);
  const [addedExtras, setAddedExtras] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const cancelFlow = useCancelBookingFlow(async () => {
    void navigate({ to: "/account/bookings" });
  }, copy.cancelError);

  useEffect(() => {
    setEditing(editMode);
  }, [editMode]);

  useEffect(() => {
    void fetchUserBooking(bookingId)
      .then((data) => {
        if (!data) throw new Error(copy.notFound);
        setBooking(data);
        setDeliveryAddress(data.delivery_address ?? pickupLocationLabel(data));
        setCollectionAddress(data.collection_address ?? "");
        setAdditionalDriverName(data.additional_driver_name ?? "");
        setAdditionalDriverLicense(data.additional_driver_license ?? "");
      })
      .catch(() => setError(copy.loadError))
      .finally(() => setLoading(false));
  }, [bookingId, copy.loadError, copy.notFound]);

  useEffect(() => {
    if (!editing) return;
    void getBookingExtras()
      .then(setAvailableExtras)
      .catch(() => setAvailableExtras([]));
  }, [editing]);

  const modifiable = booking ? canModifyBooking(booking) : false;
  const cancellable = booking ? canCancelBooking(booking) : false;
  const freeExtras = useMemo(
    () => availableExtras.filter((extra) => Number(extra.price_per_day) === 0),
    [availableExtras],
  );

  const addedExtrasTotal = useMemo(() => {
    if (!booking) return 0;
    const days = Math.max(
      1,
      Math.round(
        (new Date(`${booking.return_date}T12:00:00`).getTime() -
          new Date(`${booking.pickup_date}T12:00:00`).getTime()) /
          86_400_000,
      ),
    );
    return freeExtras.reduce((sum, extra) => {
      const quantity = addedExtras[extra.id] ?? 0;
      return sum + Number(extra.price_per_day) * quantity * days;
    }, 0);
  }, [addedExtras, freeExtras, booking]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!booking) return;

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      await updateUserBookingRental({
        bookingId: booking.id,
        deliveryAddress: deliveryAddress.trim(),
        collectionAddress: collectionAddress.trim(),
        addExtras: Object.entries(addedExtras)
          .filter(([, quantity]) => quantity > 0)
          .map(([id, quantity]) => ({ id, quantity })),
        additionalDriverName: additionalDriverName.trim(),
        additionalDriverLicense: additionalDriverLicense.trim(),
      });
      const refreshed = await fetchUserBooking(booking.id);
      if (refreshed) setBooking(refreshed);
      setSaved(true);
      setEditing(false);
      setAddedExtras({});
    } catch (saveError) {
      setError(
        saveError instanceof Error && saveError.message ? saveError.message : copy.saveError,
      );
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
  const pickupDate = formatAccountDate(booking.pickup_date, intlLocale);
  const returnDate = formatAccountDate(booking.return_date, intlLocale);
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
          <WhatsAppSupportButton className="mt-4" />
        </AccountCard>
      ) : null}

      {editing ? (
        <AccountCard>
          <AccountSectionTitle title={copy.changeTitle} />
          <form onSubmit={(event) => void handleSave(event)} className="space-y-4">
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
                placeholder={copy.sameAsPickup}
                className="field-input"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={copy.additionalDriver}>
                <input
                  type="text"
                  value={additionalDriverName}
                  onChange={(event) => setAdditionalDriverName(event.target.value)}
                  className="field-input"
                />
              </Field>
              <Field label={copy.licenseNumber}>
                <input
                  type="text"
                  value={additionalDriverLicense}
                  onChange={(event) => setAdditionalDriverLicense(event.target.value)}
                  className="field-input"
                />
              </Field>
            </div>

            {freeExtras.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {copy.addExtras}
                </p>
                {freeExtras.map((extra) => (
                  <label
                    key={extra.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm"
                  >
                    <span>
                      <span className="font-semibold">{extra.name}</span>
                      <span className="ml-2 text-muted-foreground">
                        {formatPrice(Number(extra.price_per_day), intlLocale)}
                      </span>
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={addedExtras[extra.id] ?? 0}
                      onChange={(event) =>
                        setAddedExtras((current) => ({
                          ...current,
                          [extra.id]: Math.max(0, Number(event.target.value)),
                        }))
                      }
                      className="h-10 w-20 rounded-lg border border-black/10 px-3 text-right text-base sm:text-sm"
                    />
                  </label>
                ))}
              </div>
            ) : null}

            <div className="rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span>{copy.currentTotal}</span>
                <strong>{formatPrice(Number(booking.total), intlLocale)}</strong>
              </div>
              <div className="mt-2 flex justify-between text-muted-foreground">
                <span>{copy.priceDelta}</span>
                <strong>{formatPrice(addedExtrasTotal, intlLocale)}</strong>
              </div>
              <div className="mt-2 flex justify-between">
                <span>{copy.newTotal}</span>
                <strong>{formatPrice(Number(booking.total) + addedExtrasTotal, intlLocale)}</strong>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <AccountPrimaryButton type="submit" disabled={saving} className="flex-1">
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
                label={copy.pickupDate}
                value={pickupDate}
              />
              <AccountDetailRow
                icon={<Calendar className="size-4" />}
                label={copy.returnDate}
                value={returnDate}
              />
              <AccountDetailRow
                icon={<Clock className="size-4" />}
                label={copy.sections.rentalDetails}
                value={dateRange}
              />
              <AccountDetailRow
                icon={<Clock className="size-4" />}
                label={copy.timeLabel}
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
                  {pickupDate}
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
                  {returnDate}
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
                  value={maskLicenseNumber(booking.driver_license_number)}
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
            <p className="mb-4 text-sm text-muted-foreground">
              {messages.account.supportPage.subtitle}
            </p>
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
