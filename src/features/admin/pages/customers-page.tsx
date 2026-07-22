import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { formatPrice } from "@/lib/brand";

import { getAdminCustomers } from "../api/admin.functions";
import { AdminCard, AdminPageHeader } from "../components/admin-ui";
import { useAdminI18n } from "../hooks/use-admin-i18n";
import { useAdminSecret } from "../hooks/use-admin-user";
import { formatAdminDate } from "../lib/admin-utils";

export function AdminCustomersPage() {
  const adminSecret = useAdminSecret();
  const { t, intlLocale } = useAdminI18n();
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Awaited<ReturnType<typeof getAdminCustomers>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminSecret) return;
    setLoading(true);
    void getAdminCustomers({ data: { adminSecret, search: search || undefined } })
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, [adminSecret, search]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t.customers.title} subtitle={t.customers.subtitle} />

      <input
        type="search"
        placeholder={t.customers.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-11 w-full max-w-md rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-[var(--logo-red)]"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">{t.customers.loading}</p>
      ) : (
        <AdminCard padding="none" className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-black/[0.06] bg-[#fafafa] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t.customers.columns.name}</th>
                <th className="px-4 py-3">{t.customers.columns.email}</th>
                <th className="px-4 py-3">{t.customers.columns.phone}</th>
                <th className="px-4 py-3">{t.customers.columns.bookings}</th>
                <th className="px-4 py-3">{t.customers.columns.totalSpent}</th>
                <th className="px-4 py-3">{t.customers.columns.lastRental}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email} className="border-b border-black/[0.04] hover:bg-[#fafafa]">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      to="/admin/customers/$email"
                      params={{ email: c.email }}
                      className="text-[var(--logo-red)] hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3">{c.bookingsCount}</td>
                  <td className="px-4 py-3">{formatPrice(c.totalSpent, intlLocale)}</td>
                  <td className="px-4 py-3">{formatAdminDate(c.lastRental)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      )}
    </div>
  );
}
