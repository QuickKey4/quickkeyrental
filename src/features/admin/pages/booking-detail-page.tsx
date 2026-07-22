import { Link } from "@tanstack/react-router";
import { Archive, ArchiveRestore, Loader2, Pin, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { BRAND, formatPrice } from "@/lib/brand";
import { contactHrefs } from "@/lib/contact-links";

import {
  addAdminBookingNote,
  getAdminBooking,
  getAdminFleet,
  updateAdminBooking,
  updateAdminBookingArchive,
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
import { AdminDocumentCard } from "../components/admin-document-card";
import { useAdminI18n, fleetStatusLabel, operationalStatusLabel } from "../hooks/use-admin-i18n";
import { useAdminSecret } from "../hooks/use-admin-user";
import {
  bookingRef,
  formatAdminDateTime,
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
  const [noteBody, setNoteBody] = useState("");
  const [notePinned, setNotePinned] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");

  const [carId, setCarId] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [returnLocation, setReturnLocation] = useState("");

  const load = useCallback(() => {
    if (!adminSecret) {
      setLoading(false);
      return;
    }
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
        setArchiveReason(booking.archive_reason ?? "");
      })
      .catch((e) =>
        setError(e instanceof Error ? translateError(e.message) : t.bookingDetail.loadError),
      )
      .finally(() => setLoading(false));
  }, [adminSecret, bookingId, t.bookingDetail.loadError, translateError]);

  useEffect(load, [load]);

  const saveChanges = async () => {
    if (!adminSecret || !data) return;
    const carOrDatesChanged =
      carId !== data.booking.car_id ||
      pickupDate !== data.booking.pickup_date ||
      returnDate !== data.booking.return_date;

    if (carOrDatesChanged && !window.confirm(t.bookingDetail.repricePrompt)) {
      return;
    }

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

  const addNote = async () => {
    if (!adminSecret || !noteBody.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      await addAdminBookingNote({
        data: {
          adminSecret,
          bookingId,
          body: noteBody.trim(),
          isPinned: notePinned,
        },
      });
      setNoteBody("");
      setNotePinned(false);
      load();
    } catch (e) {
      setSaveError(e instanceof Error ? translateError(e.message) : t.bookingDetail.notes.error);
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (archived: boolean) => {
    if (!adminSecret) return;
    const prompt = archived
      ? t.bookingDetail.archive.confirmArchive
      : t.bookingDetail.archive.confirmUnarchive;
    if (!window.confirm(prompt)) return;

    setSaving(true);
    setSaveError("");
    try {
      await updateAdminBookingArchive({
        data: {
          adminSecret,
          bookingId,
          archived,
          reason: archived ? archiveReason.trim() || undefined : undefined,
        },
      });
      load();
    } catch (e) {
      setSaveError(e instanceof Error ? translateError(e.message) : t.bookingDetail.archive.error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">{t.bookingDetail.loading}</p>;
  if (!data) return <p className="text-sm text-destructive">{error || t.notFound}</p>;

  const { booking, extras, documents, notes, changeEvents } = data;
  const op = getOperationalStatus(booking);
  const isCancelled = booking.status === "cancelled";
  const isArchived = Boolean(booking.archived_at);
  const paymentReference = booking.sentoo_transaction_id ?? booking.stripe_payment_intent_id ?? "—";
  const paymentProvider = booking.payment_provider || "—";
  const cancellationFee = Number(booking.cancellation_fee ?? 0);

  return (
    <div className="space-y-6">
      <Link to="/admin/bookings" className="text-sm text-muted-foreground hover:text-foreground">
        {t.bookingDetail.back}
      </Link>

      <AdminPageHeader
        title={bookingRef(booking.id)}
        subtitle={`${booking.guest_name} · ${booking.cars?.name}`}
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <AdminBadge tone={operationalBadgeTone(op)}>
              {operationalStatusLabel(op, t.status)}
            </AdminBadge>
            {isArchived ? <AdminBadge>{t.bookingDetail.archive.archived}</AdminBadge> : null}
          </div>
        }
      />

      {saveError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {saveError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <AdminCard>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold">
                  {t.bookingDetail.operations.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.bookingDetail.operations.subtitle}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {booking.status === "pending" ? (
                  <AdminButton
                    variant="primary"
                    disabled={saving}
                    onClick={() => void confirmBooking()}
                  >
                    {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                    {t.bookingDetail.confirmBooking}
                  </AdminButton>
                ) : null}
                {!isCancelled ? (
                  <AdminButton
                    variant="danger"
                    disabled={saving}
                    onClick={() => void cancelBooking()}
                  >
                    {t.bookingDetail.cancelBooking}
                  </AdminButton>
                ) : null}
              </div>
            </div>
          </AdminCard>

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
                <AdminButton
                  variant="secondary"
                  disabled={saving}
                  onClick={() => void saveChanges()}
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  {t.bookingDetail.saveChanges}
                </AdminButton>
              </div>
            </AdminCard>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminCard>
              <h2 className="font-display text-lg font-bold">{t.bookingDetail.customer}</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Info label={t.bookingDetail.fields.name} value={booking.guest_name} />
                <Info label={t.bookingDetail.fields.email} value={booking.guest_email} />
                <Info label={t.bookingDetail.fields.phone} value={booking.guest_phone} />
              </dl>
            </AdminCard>

            <AdminCard>
              <h2 className="font-display text-lg font-bold">{t.bookingDetail.driverDetails}</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <Info
                  label={t.bookingDetail.fields.license}
                  value={booking.driver_license_number ?? "—"}
                />
                <Info
                  label={t.bookingDetail.fields.primaryDob}
                  value={booking.primary_driver_date_of_birth ?? "—"}
                />
                <Info
                  label={t.bookingDetail.fields.additionalDriver}
                  value={booking.additional_driver_name ?? "—"}
                />
                <Info
                  label={t.bookingDetail.fields.additionalLicense}
                  value={booking.additional_driver_license ?? "—"}
                />
                <Info
                  label={t.bookingDetail.fields.additionalDob}
                  value={booking.additional_driver_date_of_birth ?? "—"}
                />
              </dl>
            </AdminCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminCard>
              <h2 className="font-display text-lg font-bold">{t.bookingDetail.rentalDetails}</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <Info
                  label={t.bookingDetail.fields.pickup}
                  value={formatAdminDateTime(booking.pickup_date, booking.pickup_time)}
                />
                <Info
                  label={t.bookingDetail.fields.return}
                  value={formatAdminDateTime(booking.return_date, booking.return_time)}
                />
                <Info label={t.bookingDetail.fields.pickupLocation} value={pickupLabel(booking)} />
                <Info label={t.bookingDetail.fields.returnLocation} value={returnLabel(booking)} />
                <Info
                  label={t.bookingDetail.fields.flightNumber}
                  value={booking.flight_number ?? "—"}
                />
              </dl>
            </AdminCard>

            <AdminCard>
              <h2 className="font-display text-lg font-bold">{t.bookingDetail.vehicle}</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <Info label={t.bookingDetail.fields.vehicle} value={booking.cars?.name ?? "—"} />
                <Info
                  label={t.bookingDetail.fields.dailyRate}
                  value={formatPrice(
                    Number(booking.priced_daily_rate ?? booking.cars?.daily_price ?? 0),
                    intlLocale,
                  )}
                />
                <Info
                  label={t.bookingDetail.fields.insurance}
                  value={booking.insurance_option ?? "—"}
                />
              </dl>
            </AdminCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminCard>
              <h2 className="font-display text-lg font-bold">{t.bookingDetail.payment}</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <Info
                  label={t.bookingDetail.fields.subtotal}
                  value={formatPrice(Number(booking.subtotal), intlLocale)}
                />
                <Info
                  label={t.bookingDetail.fields.extrasTotal}
                  value={formatPrice(Number(booking.extras_total), intlLocale)}
                />
                <Info
                  label={t.bookingDetail.fields.total}
                  value={formatPrice(Number(booking.total), intlLocale)}
                />
                <Info label={t.bookingDetail.fields.status} value={booking.payment_status} />
                <Info label={t.bookingDetail.fields.paymentProvider} value={paymentProvider} />
                <Info label={t.bookingDetail.fields.paymentReference} value={paymentReference} />
                {booking.sentoo_status ? (
                  <Info label={t.bookingDetail.fields.sentooStatus} value={booking.sentoo_status} />
                ) : null}
                {cancellationFee > 0 ? (
                  <>
                    <Info
                      label={t.bookingDetail.fields.cancellationFee}
                      value={formatPrice(cancellationFee, intlLocale)}
                    />
                    <Info
                      label={t.bookingDetail.fields.cancellationFeeStatus}
                      value={
                        booking.cancellation_fee_accepted_at
                          ? t.bookingDetail.cancellationFeeAccepted
                          : t.bookingDetail.cancellationFeeManual
                      }
                    />
                  </>
                ) : null}
              </dl>
            </AdminCard>

            <AdminCard>
              <h2 className="font-display text-lg font-bold">{t.bookingDetail.extras}</h2>
              {extras.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">{t.bookingDetail.noExtras}</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm">
                  {extras.map((e) => (
                    <li key={e.id} className="flex justify-between gap-3">
                      <span>{e.extra_name}</span>
                      <span>{formatPrice(Number(e.total), intlLocale)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>

          <AdminCard>
            <h2 className="font-display text-lg font-bold">{t.bookingDetail.documents}</h2>
            {documents.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {documents.map((d) => (
                  <AdminDocumentCard
                    key={d.id}
                    doc={d}
                    adminSecret={adminSecret}
                    onChanged={load}
                    compact
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{t.bookingDetail.noDocuments}</p>
            )}
          </AdminCard>

          <AdminCard>
            <h2 className="font-display text-lg font-bold">{t.bookingDetail.history.title}</h2>
            {changeEvents.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {changeEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--logo-black)]">
                          {formatEventType(event.change_type)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.source} · {formatDateTime(event.created_at, intlLocale)}
                        </p>
                      </div>
                      {Number(event.price_delta) !== 0 ? (
                        <AdminBadge>
                          {formatPrice(Number(event.price_delta), intlLocale)}
                        </AdminBadge>
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      {formatChangeValues(event.old_values, event.new_values)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{t.bookingDetail.history.empty}</p>
            )}
          </AdminCard>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <AdminCard>
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

          <AdminCard>
            <h2 className="font-display text-lg font-bold">{t.bookingDetail.notes.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.bookingDetail.notes.hint}</p>
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value.slice(0, 5000))}
              maxLength={5000}
              placeholder={t.bookingDetail.notes.placeholder}
              className={`${adminInputClassName} mt-4 min-h-28 py-3`}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={notePinned}
                  onChange={(e) => setNotePinned(e.target.checked)}
                  className="size-4 accent-[var(--logo-red)]"
                />
                {t.bookingDetail.notes.pin}
              </label>
              <span className="text-xs text-muted-foreground">{noteBody.length}/5000</span>
            </div>
            <AdminButton
              variant="primary"
              disabled={saving || !noteBody.trim()}
              onClick={() => void addNote()}
              className="mt-4"
            >
              <Plus className="size-4" />
              {t.bookingDetail.notes.add}
            </AdminButton>

            {notes.length > 0 ? (
              <ul className="mt-5 space-y-3">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className={`rounded-2xl border p-4 text-sm ${
                      note.is_pinned
                        ? "border-[var(--logo-red)]/30 bg-red-50/60"
                        : "border-black/[0.06] bg-[#fafafa]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-[var(--logo-black)]">
                        {note.author_display_label}
                      </p>
                      {note.is_pinned ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--logo-red)]">
                          <Pin className="size-3" />
                          {t.bookingDetail.notes.pinned}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(note.created_at, intlLocale)}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap leading-relaxed">{note.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">{t.bookingDetail.notes.empty}</p>
            )}
          </AdminCard>

          <AdminCard>
            <h2 className="font-display text-lg font-bold">{t.bookingDetail.archive.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isArchived ? t.bookingDetail.archive.archivedHint : t.bookingDetail.archive.hint}
            </p>
            {isArchived && booking.archived_at ? (
              <p className="mt-3 text-xs text-muted-foreground">
                {t.bookingDetail.archive.archivedAt}:{" "}
                {formatDateTime(booking.archived_at, intlLocale)}
              </p>
            ) : null}
            {!isArchived ? (
              <textarea
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value.slice(0, 1000))}
                maxLength={1000}
                placeholder={t.bookingDetail.archive.reasonPlaceholder}
                className={`${adminInputClassName} mt-4 min-h-20 py-3`}
              />
            ) : booking.archive_reason ? (
              <p className="mt-4 rounded-xl bg-[#fafafa] px-3 py-2 text-sm">
                {booking.archive_reason}
              </p>
            ) : null}
            <AdminButton
              variant={isArchived ? "secondary" : "danger"}
              disabled={saving}
              onClick={() => void toggleArchive(!isArchived)}
              className="mt-4"
            >
              {isArchived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
              {isArchived ? t.bookingDetail.archive.unarchive : t.bookingDetail.archive.archive}
            </AdminButton>
          </AdminCard>
        </aside>
      </div>

      <p className="text-xs text-muted-foreground">
        {t.supportLine}: {BRAND.phone} · {contactHrefs.email}
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function formatDateTime(value: string, intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatEventType(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatChangeValues(oldValues: unknown, newValues: unknown): string {
  const oldText = summarizeJson(oldValues);
  const newText = summarizeJson(newValues);
  if (oldText && newText) return `From ${oldText} to ${newText}`;
  if (newText) return `New values: ${newText}`;
  if (oldText) return `Previous values: ${oldText}`;
  return "Stored event without additional field details.";
}

function summarizeJson(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, entryValue]) => entryValue !== null && entryValue !== undefined && entryValue !== "",
  );
  return entries
    .slice(0, 6)
    .map(([key, entryValue]) => `${key.replaceAll("_", " ")}: ${String(entryValue)}`)
    .join(", ");
}
