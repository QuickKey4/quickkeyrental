import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { BRAND, formatPrice } from "@/lib/brand";
import { contactHrefs } from "@/lib/contact-links";

import {
  getAdminBooking,
  getAdminFleet,
  updateAdminBooking,
} from "../api/admin.functions";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminContactButtons,
  AdminField,
  AdminPageHeader,
  adminInputClassName,
  operationalBadgeTone,
} from "../components/admin-ui";
import { useAdminI18n, fleetStatusLabel, operationalStatusLabel } from "../hooks/use-admin-i18n";
import { useAdminSecret } from "../hooks/use-admin-user";
import {
  bookingRef,
  getOperationalStatus,
  pickupLabel,
  returnLabel,
} from "../lib/admin-utils";

type AdminBookingDetailPageProps = {
  bookingId: string;
};

type FleetCar = Awaited<ReturnType<typeof getAdminFleet>>[number];

export function AdminBookingDetailPage({ bookingId }: AdminBookingDetailPageProps) {
  const adminSecret = useAdminSecret();
  const { t, intlLocale, translateError } = useAdminI18n();
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminBooking>> | null>(null);
  const [cars, setCars] = useState<FleetCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");

  const [carId, setCarId] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [returnLocation, setReturnLocation] = useState("");

  const load = () => {
    if (!adminSecret) return;
    setLoading(true);
    void Promise.all([
      getAdminBooking({ data: { adminSecret, bookingId } }),
      getAdminFleet({ data: { adminSecret } }),
    ])
      .then(([bookingData, fleetCars]) => {
        setData(bookingData);
        setCars(fleetCars);
        const { booking } = bookingData;
        setCarId(booking.car_id);
        setPickupDate(booking.pickup_date);
        setReturnDate(booking.return_date);
        setPickupLocation(pickupLabel(booking));
        setReturnLocation(returnLabel(booking));
      })
      .catch((e) =>
        setError(e instanceof Error ? translateError(e.message) : t.bookingDetail.loadError),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, [adminSecret, bookingId]);

  const saveChanges = async () => {
    if (!adminSecret || !data) return;
    setSaving(true);
    setSaveError("");

    try {
      await updateAdminBooking({
        data: {
          adminSecret,
          bookingId,
          carId: carId !== data.booking.car_id ? carId : undefined,
          pickupDate: pickupDate !== data.booking.pickup_date ? pickupDate : undefined,
          returnDate: returnDate !== data.booking.return_date ? returnDate : undefined,
          pickupLocation: pickupLocation !== pickupLabel(data.booking) ? pickupLocation : undefined,
          returnLocation: returnLocation !== returnLabel(data.booking) ? returnLocation : undefined,
        },
      });
      load();
    } catch (e) {
      setSaveError(e instanceof Error ? translateError(e.message) : t.bookingDetail.saveError);
    } finally {
      setSaving(false);
    }
  };

  const confirmBooking = async () => {
    if (!adminSecret || !window.confirm(t.bookingDetail.confirmPrompt)) return;
    setSaving(true);
    setSaveError("");
    try {
      await updateAdminBooking({ data: { adminSecret, bookingId, status: "confirmed" } });
      load();
    } catch (e) {
      setSaveError(e instanceof Error ? translateError(e.message) : t.bookingDetail.confirmError);
    } finally {
      setSaving(false);
    }
  };

  const cancelBooking = async () => {
    if (!adminSecret || !window.confirm(t.bookingDetail.cancelPrompt)) return;
    setSaving(true);
    setSaveError("");
    try {
      await updateAdminBooking({ data: { adminSecret, bookingId, status: "cancelled" } });
      load();
    } catch (e) {
      setSaveError(e instanceof Error ? translateError(e.message) : t.bookingDetail.cancelError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">{t.bookingDetail.loading}</p>;
  if (!data) return <p className="text-sm text-destructive">{error || t.notFound}</p>;

  const { booking, extras, documents } = data;
  const op = getOperationalStatus(booking);
  const isCancelled = booking.status === "cancelled";

  return (
    <div className="space-y-6">
      <Link to="/admin/bookings" className="text-sm text-muted-foreground hover:text-foreground">
        {t.bookingDetail.back}
      </Link>

      <AdminPageHeader
        title={bookingRef(booking.id)}
        subtitle={`${booking.guest_name} · ${booking.cars?.name}`}
        action={
          <AdminBadge tone={operationalBadgeTone(op)}>{operationalStatusLabel(op, t.status)}</AdminBadge>
        }
      />

      {saveError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {saveError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <AdminCard className="xl:col-span-2">
          <h2 className="font-display text-lg font-bold">{t.bookingDetail.customer}</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Info label={t.bookingDetail.fields.name} value={booking.guest_name} />
            <Info label={t.bookingDetail.fields.email} value={booking.guest_email} />
            <Info label={t.bookingDetail.fields.phone} value={booking.guest_phone} />
          </dl>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.bookingDetail.contact}</h2>
          <AdminContactButtons
            className="mt-4"
            phone={booking.guest_phone}
            email={booking.guest_email}
          />
        </AdminCard>
      </div>

      {!isCancelled ? (
        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.bookingDetail.manage}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.bookingDetail.manageHint}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <AdminField label={t.bookingDetail.fields.vehicle}>
              <select
                value={carId}
                onChange={(e) => setCarId(e.target.value)}
                className={adminInputClassName}
              >
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name}
                    {car.license_plate ? ` · ${car.license_plate}` : ""}
                    {car.fleet_status === "maintenance"
                      ? ` (${fleetStatusLabel("maintenance", t.fleetStatus)})`
                      : ""}
                    {car.fleet_status === "disabled"
                      ? ` (${fleetStatusLabel("disabled", t.fleetStatus)})`
                      : ""}
                  </option>
                ))}
              </select>
            </AdminField>

            <div />

            <AdminField label={t.bookingDetail.fields.pickupDate}>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className={adminInputClassName}
              />
            </AdminField>

            <AdminField label={t.bookingDetail.fields.returnDate}>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className={adminInputClassName}
              />
            </AdminField>

            <AdminField label={t.bookingDetail.fields.pickupLocation}>
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className={adminInputClassName}
              />
            </AdminField>

            <AdminField label={t.bookingDetail.fields.returnLocation}>
              <input
                type="text"
                value={returnLocation}
                onChange={(e) => setReturnLocation(e.target.value)}
                className={adminInputClassName}
              />
            </AdminField>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {booking.status === "pending" ? (
              <AdminButton variant="primary" disabled={saving} onClick={() => void confirmBooking()}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {t.bookingDetail.confirmBooking}
              </AdminButton>
            ) : null}
            <AdminButton variant="secondary" disabled={saving} onClick={() => void saveChanges()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {t.bookingDetail.saveChanges}
            </AdminButton>
            <AdminButton variant="danger" disabled={saving} onClick={() => void cancelBooking()}>
              {t.bookingDetail.cancelBooking}
            </AdminButton>
          </div>
        </AdminCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.bookingDetail.driverDetails}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Info label={t.bookingDetail.fields.license} value={booking.driver_license_number ?? "—"} />
            <Info
              label={t.bookingDetail.fields.additionalDriver}
              value={booking.additional_driver_name ?? "—"}
            />
            <Info
              label={t.bookingDetail.fields.additionalLicense}
              value={booking.additional_driver_license ?? "—"}
            />
          </dl>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.bookingDetail.rentalDetails}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Info label={t.bookingDetail.fields.vehicle} value={booking.cars?.name ?? "—"} />
            <Info
              label={t.bookingDetail.fields.pickup}
              value={`${booking.pickup_date} ${booking.pickup_time.slice(0, 5)}`}
            />
            <Info
              label={t.bookingDetail.fields.return}
              value={`${booking.return_date} ${booking.return_time.slice(0, 5)}`}
            />
            <Info label={t.bookingDetail.fields.pickupLocation} value={pickupLabel(booking)} />
            <Info label={t.bookingDetail.fields.returnLocation} value={returnLabel(booking)} />
          </dl>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.bookingDetail.payment}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Info label={t.bookingDetail.fields.total} value={formatPrice(Number(booking.total), intlLocale)} />
            <Info label={t.bookingDetail.fields.status} value={booking.payment_status} />
            <Info label={t.bookingDetail.fields.stripeId} value={booking.stripe_payment_intent_id ?? "—"} />
            <Info label={t.bookingDetail.fields.insurance} value={booking.insurance_option ?? "—"} />
          </dl>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.bookingDetail.extras}</h2>
          {extras.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t.bookingDetail.noExtras}</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {extras.map((e) => (
                <li key={e.id} className="flex justify-between">
                  <span>{e.extra_name}</span>
                  <span>{formatPrice(Number(e.total), intlLocale)}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      {documents.length > 0 ? (
        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.bookingDetail.documents}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {documents.map((d) => (
              <li key={d.id} className="flex justify-between gap-3">
                <span>{d.file_name}</span>
                <AdminBadge>{d.verification_status}</AdminBadge>
              </li>
            ))}
          </ul>
        </AdminCard>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {t.supportLine}: {BRAND.phone} · {contactHrefs.email}
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
