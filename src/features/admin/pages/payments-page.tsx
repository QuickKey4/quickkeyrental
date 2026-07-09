import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { formatPrice } from "@/lib/brand";

import { getAdminPayments } from "../api/admin.functions";
import { AdminBadge, AdminCard, AdminMetricCard, AdminPageHeader } from "../components/admin-ui";
import { useAdminI18n } from "../hooks/use-admin-i18n";
import { useAdminSecret } from "../hooks/use-admin-user";

const FILTERS = ["all", "paid", "unpaid", "pending"] as const;
type PaymentFilter = (typeof FILTERS)[number];

export function AdminPaymentsPage() {
  const adminSecret = useAdminSecret();
  const { t, intlLocale } = useAdminI18n();
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminPayments>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminSecret) return;
    setLoading(true);
    void getAdminPayments({ data: { adminSecret, filter } })
      .then(setData)
      .finally(() => setLoading(false));
  }, [adminSecret, filter]);

  if (loading || !data) {
    return <p className="text-sm text-muted-foreground">{t.payments.loading}</p>;
  }

  const maxRevenue = Math.max(...data.chart.map((d) => d.revenue), 1);

  const paymentStatusLabel = (status: string) => {
    if (status === "paid" || status === "unpaid" || status === "pending") {
      return t.filters[status];
    }
    return status;
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader title={t.payments.title} subtitle={t.payments.subtitle} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label={t.payments.today}
          value={formatPrice(data.revenue.today, intlLocale)}
          tone="red"
        />
        <AdminMetricCard
          label={t.payments.thisWeek}
          value={formatPrice(data.revenue.week, intlLocale)}
        />
        <AdminMetricCard
          label={t.payments.thisMonth}
          value={formatPrice(data.revenue.month, intlLocale)}
        />
        <AdminMetricCard
          label={t.payments.thisYear}
          value={formatPrice(data.revenue.year, intlLocale)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminCard className="lg:col-span-2">
          <h2 className="font-display text-lg font-bold">{t.payments.chartTitle}</h2>
          <div className="mt-6 flex h-40 items-end gap-1">
            {data.chart.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-[var(--logo-red)]/80"
                  style={{ height: `${Math.max(4, (day.revenue / maxRevenue) * 100)}%` }}
                  title={`${day.date}: ${formatPrice(day.revenue, intlLocale)}`}
                />
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.payments.utilizationTitle}</h2>
          <p className="mt-4 font-display text-5xl font-bold text-[var(--logo-red)]">
            {data.utilization}%
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{t.payments.utilizationHint}</p>
        </AdminCard>
      </div>

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

      <AdminCard padding="none" className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-black/[0.06] bg-[#fafafa] text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t.payments.columns.ref}</th>
              <th className="px-4 py-3">{t.payments.columns.customer}</th>
              <th className="px-4 py-3">{t.payments.columns.pickup}</th>
              <th className="px-4 py-3">{t.payments.columns.amount}</th>
              <th className="px-4 py-3">{t.payments.columns.status}</th>
              <th className="px-4 py-3">{t.payments.columns.stripe}</th>
            </tr>
          </thead>
          <tbody>
            {data.payments.map((p) => (
              <tr key={p.id} className="border-b border-black/[0.04] hover:bg-[#fafafa]">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link
                    to="/admin/bookings/$bookingId"
                    params={{ bookingId: p.id }}
                    className="text-[var(--logo-red)] hover:underline"
                  >
                    {p.ref}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    to="/admin/bookings/$bookingId"
                    params={{ bookingId: p.id }}
                    className="hover:text-[var(--logo-red)]"
                  >
                    {p.guestName}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.pickupDate}</td>
                <td className="px-4 py-3">{formatPrice(p.total, intlLocale)}</td>
                <td className="px-4 py-3">
                  <AdminBadge tone={p.paymentStatus === "paid" ? "green" : "amber"}>
                    {paymentStatusLabel(p.paymentStatus)}
                  </AdminBadge>
                </td>
                <td className="max-w-[120px] truncate px-4 py-3 text-xs text-muted-foreground">
                  {p.stripeId ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminCard>
    </div>
  );
}
