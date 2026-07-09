import { useEffect, useState } from "react";

import { getAdminSettings } from "../api/admin.functions";
import { AdminCard, AdminPageHeader } from "../components/admin-ui";
import { useAdminI18n } from "../hooks/use-admin-i18n";
import { useAdminSecret } from "../hooks/use-admin-user";

export function AdminSettingsPage() {
  const adminSecret = useAdminSecret();
  const { t } = useAdminI18n();
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!adminSecret) return;
    void getAdminSettings({ data: { adminSecret } }).then(setSettings);
  }, [adminSecret]);

  if (!settings) {
    return <p className="text-sm text-muted-foreground">{t.settings.loading}</p>;
  }

  const comingSoonItems = [
    t.settings.comingSoonItems.loyalty,
    t.settings.comingSoonItems.referral,
    t.settings.comingSoonItems.multiAdmin,
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t.settings.title} subtitle={t.settings.subtitle} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsList title={t.settings.locations} items={settings.locations as string[]} />
        <SettingsList title={t.settings.vehicleTypes} items={settings.vehicleTypes as string[]} />
        <SettingsList title={t.settings.extras} items={settings.extras as string[]} />
        <SettingsList title={t.settings.insurance} items={settings.insurance as string[]} />
      </div>

      <AdminCard>
        <h2 className="font-display text-lg font-bold">{t.settings.newsletter}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.settings.newsletterBody}</p>
        <p className="mt-2 text-sm">
          {t.settings.statusLabel}:{" "}
          <span className="font-semibold">
            {(settings.newsletter as { enabled?: boolean })?.enabled ? t.enabled : t.disabled}
          </span>
        </p>
      </AdminCard>

      <AdminCard>
        <h2 className="font-display text-lg font-bold">{t.settings.comingSoon}</h2>
        <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground">
          {comingSoonItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}

function SettingsList({ title, items }: { title: string; items: string[] }) {
  return (
    <AdminCard>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {items?.map((item) => (
          <li key={item} className="rounded-lg bg-[#fafafa] px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </AdminCard>
  );
}
