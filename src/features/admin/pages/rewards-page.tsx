import { useEffect, useState } from "react";

import { createAdminRewardAdjustment, getAdminRewards } from "../api/admin.functions";
import {
  AdminButton,
  AdminCard,
  AdminField,
  AdminPageHeader,
  adminInputClassName,
} from "../components/admin-ui";
import { useAdminI18n } from "../hooks/use-admin-i18n";
import { useAdminSecret } from "../hooks/use-admin-user";

type AdminRewardsData = Awaited<ReturnType<typeof getAdminRewards>>;
type AdminRewardTransaction = AdminRewardsData["transactions"][number];

export function AdminRewardsPage() {
  const adminSecret = useAdminSecret();
  const { t } = useAdminI18n();
  const [email, setEmail] = useState("");
  const [points, setPoints] = useState(250);
  const [reason, setReason] = useState("");
  const [type, setType] = useState<"admin_adjustment" | "historical_credit" | "review_bonus">(
    "review_bonus",
  );
  const [data, setData] = useState<AdminRewardsData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!adminSecret) return;
    setLoading(true);
    void getAdminRewards({ data: { adminSecret, email: email || undefined } })
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(load, [adminSecret]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adminSecret || !email || !reason) return;
    if (
      !window.confirm(
        t.rewards.confirmAdd
          .replace("{points}", String(points))
          .replace("{email}", email)
          .replace("{type}", t.rewards.types[type]),
      )
    ) {
      return;
    }

    await createAdminRewardAdjustment({
      data: { adminSecret, email, points, reason, type },
    });
    setReason("");
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t.rewards.title} subtitle={t.rewards.subtitle} />

      <AdminCard>
        <form
          onSubmit={submit}
          className="grid gap-4 lg:grid-cols-[1fr_140px_180px_1fr_auto] lg:items-end"
        >
          <AdminField label={t.rewards.email}>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={adminInputClassName}
            />
          </AdminField>
          <AdminField label={t.rewards.points}>
            <input
              type="number"
              value={points}
              onChange={(event) => setPoints(Number(event.target.value))}
              className={adminInputClassName}
            />
          </AdminField>
          <AdminField label={t.rewards.type}>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as typeof type)}
              className={adminInputClassName}
            >
              <option value="review_bonus">{t.rewards.types.review_bonus}</option>
              <option value="historical_credit">{t.rewards.types.historical_credit}</option>
              <option value="admin_adjustment">{t.rewards.types.admin_adjustment}</option>
            </select>
          </AdminField>
          <AdminField label={t.rewards.reason}>
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className={adminInputClassName}
            />
          </AdminField>
          <AdminButton variant="primary" type="submit" disabled={!email || !reason}>
            {t.rewards.add}
          </AdminButton>
        </form>
      </AdminCard>

      <AdminCard>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">{t.rewards.ledger}</h2>
          <AdminButton variant="secondary" onClick={load}>
            {t.rewards.refresh}
          </AdminButton>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.rewards.balance}: <strong>{data?.balance ?? 0}</strong>
        </p>
        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">{t.loading}</p>
        ) : !data || data.transactions.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t.rewards.empty}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">{t.rewards.email}</th>
                  <th className="px-3 py-2">{t.rewards.type}</th>
                  <th className="px-3 py-2">{t.rewards.points}</th>
                  <th className="px-3 py-2">{t.rewards.reason}</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((row: AdminRewardTransaction) => (
                  <tr key={row.id} className="border-t border-black/[0.06]">
                    <td className="px-3 py-2">{row.customer_email ?? "—"}</td>
                    <td className="px-3 py-2">{row.transaction_type}</td>
                    <td className="px-3 py-2 font-semibold">{row.points_delta}</td>
                    <td className="px-3 py-2">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
