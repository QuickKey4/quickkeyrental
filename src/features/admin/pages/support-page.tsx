import { BRAND } from "@/lib/brand";
import { contactHrefs } from "@/lib/contact-links";

import { AdminButton, AdminCard, AdminPageHeader } from "../components/admin-ui";
import { useAdminI18n } from "../hooks/use-admin-i18n";

export function AdminSupportPage() {
  const { t } = useAdminI18n();

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t.support.title} subtitle={t.support.subtitle} />

      <div className="grid gap-4 md:grid-cols-3">
        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.support.whatsappTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.support.whatsappBody}</p>
          <a href={contactHrefs.whatsapp} target="_blank" rel="noreferrer" className="mt-4 block">
            <AdminButton className="w-full" variant="primary">
              {t.support.whatsappButton}
            </AdminButton>
          </a>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.support.phoneTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.support.phoneBody}</p>
          <a href={`tel:${BRAND.phoneTel}`} className="mt-4 block">
            <AdminButton className="w-full" variant="secondary">
              {BRAND.phone}
            </AdminButton>
          </a>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-lg font-bold">{t.support.emailTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.support.emailBody}</p>
          <a href={contactHrefs.email} className="mt-4 block">
            <AdminButton className="w-full" variant="secondary">
              {BRAND.email}
            </AdminButton>
          </a>
        </AdminCard>
      </div>

      <AdminCard>
        <p className="text-sm text-muted-foreground">{t.support.tip}</p>
      </AdminCard>
    </div>
  );
}
