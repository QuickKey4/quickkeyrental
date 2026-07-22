import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { formatPrice } from "@/lib/brand";

import { getAdminBookings } from "../api/admin.functions";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminPageHeader,
  operationalBadgeTone,
} from "../components/admin-ui";
import { useAdminI18n, operationalStatusLabel } from "../hooks/use-admin-i18n";
import { useAdminSecret } from "../hooks/use-admin-user";
import {
  bookingRef,
  formatAdminDate,
  getOperationalStatus,
  isArchivedBooking,
  pickupLabel,
  type AdminBooking,
} from "../lib/admin-utils";

const FILTERS = [
  "upcoming",
  "today",
  "active",
  "pending",
  "completed",
  "cancelled",
  "archived",
  "all",
] as const;

type Filter = (typeof FILTERS)[number];

export function AdminBookingsPage() {
  const adminSecret = useAdminSecret();
  const { t, intlLocale } = useAdminI18n();
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const paymentStatusLabel = (status: string) => {
    if (status === "paid" || status === "unpaid" || status === "pending") return t.filters[status];
    return status;
  };

  const emptyMessage = search.trim()
    ? t.bookings.empty.search
    : (t.bookings.empty[filter] ?? t.bookings.empty.all);

  useEffect(() => {
    if (!adminSecret) return;
    setLoading(true);
    void getAdminBookings({ data: { adminSecret, filter, search: search || undefined } })
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [adminSecret, filter, search]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t.bookings.title}
        subtitle={t.bookings.subtitle}
        action={
          <div className="flex gap-2">
            <AdminButton
              variant={view === "cards" ? "primary" : "secondary"}
              onClick={() => setView("cards")}
            >
              {t.cards}
            </AdminButton>
            <AdminButton
              variant={view === "table" ? "primary" : "secondary"}
              onClick={() => setView("table")}
            >
              {t.table}
            </AdminButton>
          </div>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          type="search"
          placeholder={t.bookings.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 flex-1 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-[var(--logo-red)]"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-xs font-semibold capitalize ${
                filter === f
                  ? "bg-[var(--logo-red)] text-white"
                  : "border border-black/10 bg-white text-foreground"
              }`}
            >
              {t.filters[f]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t.bookings.loading}</p>
      ) : bookings.length === 0 ? (
        <AdminCard>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </AdminCard>
      ) : view === "table" ? (
        <AdminCard padding="none" className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="border-b border-black/[0.06] bg-[#fafafa] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t.bookings.columns.ref}</th>
                <th className="px-4 py-3">{t.bookings.columns.customer}</th>
                <th className="px-4 py-3">{t.bookings.columns.contact}</th>
                <th className="px-4 py-3">{t.bookings.columns.vehicle}</th>
                <th className="px-4 py-3">{t.bookings.columns.pickup}</th>
                <th className="px-4 py-3">{t.bookings.columns.return}</th>
                <th className="px-4 py-3">{t.bookings.columns.pickupLocation}</th>
                <th className="px-4 py-3">{t.bookings.columns.total}</th>
                <th className="px-4 py-3">{t.bookings.columns.payment}</th>
                <th className="px-4 py-3">{t.bookings.columns.status}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const op = getOperationalStatus(b);
                const archived = isArchivedBooking(b);
                return (
                  <tr key={b.id} className="border-b border-black/[0.04] hover:bg-[#fafafa]">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--logo-red)]">
                      <Link to="/admin/bookings/$bookingId" params={{ bookingId: b.id }}>
                        {bookingRef(b.id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to="/admin/bookings/$bookingId"
                        params={{ bookingId: b.id }}
                        className="font-medium hover:text-[var(--logo-red)]"
                      >
                        {b.guest_name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">{b.guest_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`tel:${b.guest_phone}`} className="hover:text-[var(--logo-red)]">
                        {b.guest_phone}
                      </a>
                    </td>
                    <td className="px-4 py-3">{b.cars?.name}</td>
                    <td className="px-4 py-3">{formatAdminDate(b.pickup_date)}</td>
                    <td className="px-4 py-3">{formatAdminDate(b.return_date)}</td>
                    <td className="max-w-[180px] truncate px-4 py-3" title={pickupLabel(b)}>
                      {pickupLabel(b)}
                    </td>
                    <td className="px-4 py-3">{formatPrice(Number(b.total), intlLocale)}</td>
                    <td className="px-4 py-3">
                      <AdminBadge tone={b.payment_status === "paid" ? "green" : "amber"}>
                        {paymentStatusLabel(b.payment_status)}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <AdminBadge tone={operationalBadgeTone(op)}>
                          {operationalStatusLabel(op, t.status)}
                        </AdminBadge>
                        {archived ? <AdminBadge>{t.filters.archived}</AdminBadge> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </AdminCard>
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {bookings.map((b) => {
            const op = getOperationalStatus(b);
            const archived = isArchivedBooking(b);
            return (
              <AdminCard key={b.id} className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-[var(--logo-red)]">{bookingRef(b.id)}</p>
                    <h3 className="truncate font-display text-lg font-bold">{b.guest_name}</h3>
                    <p className="truncate text-sm text-muted-foreground">{b.guest_email}</p>
                    <p className="truncate text-sm text-muted-foreground">{b.guest_phone}</p>
                  </div>
                  <span className="shrink-0">
                    <span className="flex flex-wrap justify-end gap-1.5">
                      <AdminBadge tone={operationalBadgeTone(op)}>
                        {operationalStatusLabel(op, t.status)}
                      </AdminBadge>
                      {archived ? <AdminBadge>{t.filters.archived}</AdminBadge> : null}
                    </span>
                  </span>
                </div>
                <dl className="mt-4 space-y-2.5 text-sm">
                  <BookingDetailRow label={t.bookings.vehicle} value={b.cars?.name ?? "—"} />
                  <BookingDetailRow
                    label={t.bookings.dates}
                    value={`${formatAdminDate(b.pickup_date)} – ${formatAdminDate(b.return_date)}`}
                  />
                  <BookingDetailRow label={t.bookings.pickup} value={pickupLabel(b)} clamp />
                  <BookingDetailRow
                    label={t.bookings.payment}
                    value={paymentStatusLabel(b.payment_status)}
                    valueClassName={
                      b.payment_status === "paid" ? "text-emerald-700" : "text-amber-800"
                    }
                  />
                  <BookingDetailRow
                    label={t.bookings.total}
                    value={formatPrice(Number(b.total), intlLocale)}
                    valueClassName="font-bold text-[var(--logo-red)] whitespace-nowrap"
                  />
                </dl>
                <div className="mt-4">
                  <Link to="/admin/bookings/$bookingId" params={{ bookingId: b.id }}>
                    <AdminButton variant="primary">{t.bookings.viewBooking}</AdminButton>
                  </Link>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BookingDetailRow({
  label,
  value,
  valueClassName,
  clamp,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  clamp?: boolean;
}) {
  return (
    <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-start gap-x-3">
      <dt className="pt-0.5 text-muted-foreground">{label}</dt>
      <dd
        className={`min-w-0 text-right font-medium ${clamp ? "line-clamp-2 break-words" : ""} ${valueClassName ?? ""}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
