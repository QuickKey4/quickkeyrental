import { Mail, Phone } from "lucide-react";

import { useI18n } from "@/i18n/provider";
import { BRAND } from "@/lib/brand";
import { contactHrefs } from "@/lib/contact-links";

import { AccountContent } from "../account-layout";
import { AccountCard, AccountPageHeader } from "../components/account-ui";
import { WhatsAppSupportButton } from "../components/whatsapp-support-button";

export function SupportPage() {
  const { messages } = useI18n();
  const copy = messages.account.supportPage;

  return (
    <AccountContent className="space-y-6">
      <AccountPageHeader title={copy.title} subtitle={copy.subtitle} />

      <div className="grid gap-4">
        <AccountCard padding="none" className="p-2">
          <WhatsAppSupportButton className="min-h-16 w-full justify-center rounded-2xl text-base" />
        </AccountCard>

        <AccountCard>
          <a
            href={`tel:${BRAND.phoneTel}`}
            className="flex min-h-14 items-center justify-center gap-3 text-base font-semibold text-[var(--logo-black)] transition-colors hover:text-[var(--logo-red)]"
          >
            <Phone className="size-5 text-[var(--logo-red)]" />
            {copy.call} · {BRAND.phone}
          </a>
        </AccountCard>

        <AccountCard>
          <a
            href={contactHrefs.email}
            className="flex min-h-14 items-center justify-center gap-3 text-base font-semibold text-[var(--logo-black)] transition-colors hover:text-[var(--logo-red)]"
          >
            <Mail className="size-5 text-[var(--logo-red)]" />
            {copy.email} · {BRAND.email}
          </a>
        </AccountCard>
      </div>

      <AccountCard>
        <p className="text-sm leading-relaxed text-muted-foreground">{copy.note}</p>
      </AccountCard>
    </AccountContent>
  );
}
