import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { formatPrice } from "@/lib/brand";

import { getAdminCustomer } from "../api/admin.functions";
import { AdminDocumentCard } from "../components/admin-document-card";
import { AdminCard, AdminContactButtons, AdminPageHeader } from "../components/admin-ui";
import { useAdminI18n, operationalStatusLabel } from "../hooks/use-admin-i18n";
import { useAdminSecret } from "../hooks/use-admin-user";
import { bookingRef, formatAdminDate, getOperationalStatus } from "../lib/admin-utils";

type AdminCustomerDetailPageProps = {
  email: string;
};

export function AdminCustomerDetailPage({ email }: AdminCustomerDetailPageProps) {
  const adminSecret = useAdminSecret();
  const { t, intlLocale } = useAdminI18n();
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminCustomer>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminSecret) return;
    void getAdminCustomer({ data: { adminSecret, email: decodeURIComponent(email) } })
      .then(setData)
      .finally(() => setLoading(false));
  }, [adminSecret, email]);

  if (loading) return <p className="text-sm text-muted-foreground">{t.customers.loading}</p>;
  if (!data) return <p className="text-sm text-destructive">{t.customers.loadError}</p>;

  const { customer, bookings, documents } = data;
  const current = bookings.find((b) => getOperationalStatus(b) === "active");

  return (
    <div className="space-y-6">
      <Link to="/admin/customers" className="text-sm text-muted-foreground hover:text-foreground">
        ← {t.nav.customers}
      </Link>

      <AdminPageHeader title={customer.name} subtitle={customer.email} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.customers.contact}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">{t.customers.columns.phone}</dt>
              <dd className="font-medium">{customer.phone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t.customers.accountLinked}</dt>
              <dd className="font-medium">{customer.userId ? t.yes : t.no}</dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.customers.quickContact}</h2>
          <AdminContactButtons className="mt-4" phone={customer.phone} email={customer.email} />
        </AdminCard>
      </div>

      {current ? (
        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.customers.currentBooking}</h2>
          <p className="mt-2 text-sm">
            {current.cars?.name} · {operationalStatusLabel(getOperationalStatus(current), t.status)}
          </p>
          <Link
            to="/admin/bookings/$bookingId"
            params={{ bookingId: current.id }}
            className="mt-3 inline-block text-sm font-semibold text-[var(--logo-red)]"
          >
            {t.customers.viewBooking}
          </Link>
        </AdminCard>
      ) : null}

      <AdminCard>
        <h2 className="font-display text-lg font-bold">{t.customers.history}</h2>
        <ul className="mt-4 space-y-2">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-xl bg-[#fafafa] px-3 py-2 text-sm"
            >
              <Link to="/admin/bookings/$bookingId" params={{ bookingId: b.id }}>
                {bookingRef(b.id)} · {formatAdminDate(b.pickup_date)}
              </Link>
              <span>{formatPrice(Number(b.total), intlLocale)}</span>
            </li>
          ))}
        </ul>
      </AdminCard>

      {documents.length > 0 ? (
        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.nav.documents}</h2>
          <div className="mt-4 grid gap-3">
            {documents.map((d) => (
              <AdminDocumentCard
                key={d.id}
                doc={d}
                adminSecret={adminSecret}
                onChanged={() => {
                  if (!adminSecret) return;
                  void getAdminCustomer({
                    data: { adminSecret, email: decodeURIComponent(email) },
                  }).then(setData);
                }}
                compact
              />
            ))}
          </div>
        </AdminCard>
      ) : null}
    </div>
  );
}
