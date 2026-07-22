import { Gift } from "lucide-react";
import { useEffect, useState } from "react";

import { useI18n } from "@/i18n/provider";

import { AccountContent } from "../account-layout";
import { fetchRewards, type RewardTier, type RewardTransaction } from "../account-queries";
import { useAuth } from "../auth-provider";
import { AccountCard, AccountPageHeader } from "../components/account-ui";

export function RewardsPage() {
  const { messages } = useI18n();
  const copy = messages.account.rewards;
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    void fetchRewards(user.id)
      .then((result) => {
        setBalance(result.balance);
        setTransactions(result.transactions);
        setTiers(result.tiers);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <AccountContent className="space-y-6">
      <AccountPageHeader title={copy.title} subtitle={copy.subtitle} />

      <AccountCard className="bg-white">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-[var(--logo-red)]/10 text-[var(--logo-red)]">
            <Gift className="size-6" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">{copy.balance}</p>
            <p className="font-display text-3xl font-bold text-[var(--logo-black)]">
              {balance.toLocaleString()} {copy.points}
            </p>
          </div>
        </div>
      </AccountCard>

      <AccountCard>
        <h2 className="font-display text-lg font-bold">{copy.rewards}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {tiers.map((tier) => (
            <div key={tier.points} className="rounded-2xl border border-black/[0.06] bg-white p-4">
              <p className="font-semibold">
                {tier.points.toLocaleString()} {copy.points}
              </p>
              <p className="text-sm text-muted-foreground">
                {copy.credit.replace("{amount}", `$${tier.credit}`)}
              </p>
            </div>
          ))}
        </div>
      </AccountCard>

      <AccountCard>
        <h2 className="font-display text-lg font-bold">{copy.activity}</h2>
        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">{copy.loading}</p>
        ) : transactions.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-black/[0.06]">
            {transactions.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                <span>
                  <span className="font-medium">{item.reason}</span>
                  <span className="block text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </span>
                <strong
                  className={item.points_delta >= 0 ? "text-emerald-700" : "text-destructive"}
                >
                  {item.points_delta >= 0 ? "+" : ""}
                  {item.points_delta}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </AccountCard>
    </AccountContent>
  );
}
