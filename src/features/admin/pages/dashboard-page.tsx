import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { formatPrice } from "@/lib/brand";
import { interpolate } from "@/i18n/interpolate";

import { getAdminDashboard } from "../api/admin.functions";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminMetricCard,
  AdminPageHeader,
  operationalBadgeTone,
} from "../components/admin-ui";
import { useAdminI18n, operationalStatusLabel } from "../hooks/use-admin-i18n";
import { useAdminSecret } from "../hooks/use-admin-user";
import {
  bookingRef,
  formatAdminDate,
  formatAdminDateTime,
  formatAdminShortDate,
  getOperationalStatus,
  todayKey,
  type AdminBooking,
} from "../lib/admin-utils";

export function AdminDashboardPage() {
  const adminSecret = useAdminSecret();
  const { t, intlLocale } = useAdminI18n();
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminDashboard>> | null>(null);
  const [loading, setLoading] = useState(true);

  const timelineLabels = useMemo(
    () => [
      t.timeline.today,
      t.timeline.tomorrow,
      t.timeline.dayAfter,
      t.timeline.in3,
      t.timeline.in4,
      t.timeline.in5,
      t.timeline.in6,
    ],
    [t],
  );

  const load = () => {
    if (!adminSecret) return;
    setLoading(true);
    void getAdminDashboard({ data: { adminSecret } })
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(load, [adminSecret]);

  if (loading) return <p className="text-sm text-muted-foreground">{t.dashboard.loading}</p>;
  if (!data) return <p className="text-sm text-destructive">{t.dashboard.loadError}</p>;

  const today = todayKey();
  const timelineByDay = groupTimeline(data.timelineBookings, today, timelineLabels, t);

  return (
    <div className="space-y-8">
      <AdminPageHeader title={t.dashboard.title} subtitle={t.dashboard.subtitle} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <AdminMetricCard
          label={t.dashboard.todayPickups}
          value={data.metrics.todayPickups}
          tone="red"
        />
        <AdminMetricCard label={t.dashboard.todayReturns} value={data.metrics.todayReturns} />
        <AdminMetricCard label={t.dashboard.carsRented} value={data.metrics.carsRented} />
        <AdminMetricCard
          label={t.dashboard.availableCars}
          value={data.metrics.availableCars}
          tone="green"
        />
        <AdminMetricCard label={t.dashboard.pendingBookings} value={data.metrics.pendingBookings} />
        <AdminMetricCard
          label={t.dashboard.monthlyRevenue}
          value={formatPrice(data.metrics.monthlyRevenue, intlLocale)}
          tone="red"
        />
      </div>

      <AdminCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.dashboard.discountsLabel}
            </p>
            {data.discountSummary.active ? (
              <p className="mt-2 font-display text-lg font-bold text-[var(--logo-black)]">
                {data.discountSummary.active.summary}
              </p>
            ) : data.discountSummary.nextScheduled ? (
              <p className="mt-2 font-display text-lg font-bold text-[var(--logo-black)]">
                {interpolate(t.dashboard.discountScheduled, {
                  summary: data.discountSummary.nextScheduled.summary,
                })}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{t.dashboard.noDiscounts}</p>
            )}
            {data.discountSummary.active ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {interpolate(t.dashboard.discountEnds, {
                  date: formatAdminShortDate(
                    data.discountSummary.active.ends_at.slice(0, 10),
                    intlLocale,
                  ),
                  count: String(data.discountSummary.active.daysLeft ?? 0),
                })}
              </p>
            ) : data.discountSummary.scheduledCount > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {interpolate(t.dashboard.discountScheduledCount, {
                  count: String(data.discountSummary.scheduledCount),
                })}
              </p>
            ) : null}
          </div>
          <Link to="/admin/discounts">
            <AdminButton variant="secondary">{t.dashboard.manageDiscounts}</AdminButton>
          </Link>
        </div>
      </AdminCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <TodayList
          title={t.dashboard.todayPickupsList}
          emptyMessage={t.dashboard.noPickupsToday}
          bookings={data.todayPickups}
          timeKey="pickup_time"
          vehicleLabel={t.vehicle}
        />
        <TodayList
          title={t.dashboard.todayReturnsList}
          emptyMessage={t.dashboard.noReturnsToday}
          bookings={data.todayReturns}
          timeKey="return_time"
          vehicleLabel={t.vehicle}
        />
      </div>

      {data.pendingBookings.length > 0 ? (
        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.dashboard.pendingTitle}</h2>
          <ul className="mt-4 space-y-2">
            {data.pendingBookings.map((b) => (
              <li
                key={b.id}
                className="flex flex-col gap-3 rounded-xl border border-black/[0.05] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{b.guest_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {bookingRef(b.id)} · {b.cars?.name ?? t.vehicle} ·{" "}
                    {formatAdminDate(b.pickup_date)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AdminBadge tone={operationalBadgeTone(getOperationalStatus(b))}>
                    {operationalStatusLabel(getOperationalStatus(b), t.status)}
                  </AdminBadge>
                  <Link to="/admin/bookings/$bookingId" params={{ bookingId: b.id }}>
                    <AdminButton variant="secondary">{t.open}</AdminButton>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.dashboard.activity7Day}</h2>
          <div className="mt-4 space-y-5">
            {timelineByDay.map(({ label, items }) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                {items.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">{t.noActivity}</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {items.map((item) => (
                      <li key={item.id + item.kind}>
                        <Link
                          to="/admin/bookings/$bookingId"
                          params={{ bookingId: item.id }}
                          className="flex items-center justify-between gap-3 rounded-xl bg-[#fafafa] px-3 py-2 text-sm transition-colors hover:bg-black/[0.04]"
                        >
                          <span>
                            <span className="font-medium">{item.carName}</span>
                            <span className="text-muted-foreground"> · {item.kind}</span>
                            <span className="text-muted-foreground"> {item.time}</span>
                          </span>
                          <span className="text-xs text-muted-foreground">{item.guest}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.dashboard.upcomingReturns}</h2>
          <ul className="mt-4 space-y-3">
            {data.upcomingReturns.map((b) => (
              <li key={b.id}>
                <Link
                  to="/admin/bookings/$bookingId"
                  params={{ bookingId: b.id }}
                  className="block rounded-xl border border-black/[0.05] p-3 transition-colors hover:bg-[#fafafa]"
                >
                  <p className="font-medium">{b.cars?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.guest_name} · {formatAdminDateTime(b.return_date, b.return_time)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">{t.dashboard.recentBookings}</h2>
            <Link to="/admin/bookings" className="text-sm font-semibold text-[var(--logo-red)]">
              {t.viewAll}
            </Link>
          </div>
          <div className="space-y-2">
            {data.recentBookings.map((b) => {
              const op = getOperationalStatus(b);
              return (
                <Link
                  key={b.id}
                  to="/admin/bookings/$bookingId"
                  params={{ bookingId: b.id }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.05] px-3 py-3 transition-colors hover:bg-[#fafafa]"
                >
                  <div>
                    <p className="font-medium">{b.guest_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {bookingRef(b.id)} · {b.cars?.name}
                    </p>
                  </div>
                  <AdminBadge tone={operationalBadgeTone(op)}>
                    {operationalStatusLabel(op, t.status)}
                  </AdminBadge>
                </Link>
              );
            })}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.dashboard.recentCustomers}</h2>
          <ul className="mt-4 space-y-3">
            {data.recentCustomers.map((c) => (
              <li key={c.email} className="text-sm">
                <Link
                  to="/admin/customers/$email"
                  params={{ email: c.email }}
                  className="font-medium text-[var(--logo-black)] hover:text-[var(--logo-red)]"
                >
                  {c.name}
                </Link>
                <p className="text-xs text-muted-foreground">{c.action}</p>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>
    </div>
  );
}

function TodayList({
  title,
  emptyMessage,
  bookings,
  timeKey,
  vehicleLabel,
}: {
  title: string;
  emptyMessage: string;
  bookings: AdminBooking[];
  timeKey: "pickup_time" | "return_time";
  vehicleLabel: string;
}) {
  return (
    <AdminCard>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {bookings.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                to="/admin/bookings/$bookingId"
                params={{ bookingId: b.id }}
                className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.05] px-3 py-3 transition-colors hover:bg-[#fafafa]"
              >
                <div>
                  <p className="font-medium">{b.guest_name}</p>
                  <p className="text-xs text-muted-foreground">{b.cars?.name ?? vehicleLabel}</p>
                </div>
                <span className="text-sm font-semibold text-[var(--logo-red)]">
                  {b[timeKey].slice(0, 5)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}

function groupTimeline(
  bookings: Awaited<ReturnType<typeof getAdminDashboard>>["timelineBookings"],
  today: string,
  labels: string[],
  t: ReturnType<typeof useAdminI18n>["t"],
) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  return labels.map((label, index) => {
    const date = days[index];
    const items: {
      id: string;
      kind: string;
      time: string;
      carName: string;
      guest: string;
    }[] = [];

    for (const b of bookings) {
      const carName = b.cars?.name ?? t.vehicle;
      if (b.pickup_date === date) {
        items.push({
          id: b.id,
          kind: t.timeline.pickup,
          time: b.pickup_time.slice(0, 5),
          carName,
          guest: b.guest_name,
        });
      }
      if (b.return_date === date) {
        items.push({
          id: b.id,
          kind: t.timeline.return,
          time: b.return_time.slice(0, 5),
          carName,
          guest: b.guest_name,
        });
      }
    }

    return { label, items };
  });
}
