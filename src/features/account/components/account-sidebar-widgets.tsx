import { Link } from "@tanstack/react-router";
import { Headphones, Mail } from "lucide-react";

import { useI18n } from "@/i18n/provider";

import { useAuth } from "../auth-provider";
import { AccountCard } from "./account-ui";
import { WhatsAppSupportButton } from "./whatsapp-support-button";

type AccountSidebarWidgetsProps = {
  bookingCount?: number;
  showNewsletter?: boolean;
};

export function AccountSidebarWidgets({
  bookingCount = 0,
  showNewsletter = true,
}: AccountSidebarWidgetsProps) {
  const { messages, intlLocale } = useI18n();
  const { user, profile } = useAuth();
  const copy = messages.account.dashboard;

  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(
        new Date(profile.created_at),
      )
    : "—";

  return (
    <div className="space-y-4">
      <AccountCard>
        <h2 className="text-sm font-semibold text-[var(--logo-black)]">{copy.accountOverview}</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-3 border-b border-black/[0.05] pb-3">
            <dt className="text-muted-foreground">{copy.memberSince}</dt>
            <dd className="font-medium text-foreground">{memberSince}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-black/[0.05] pb-3">
            <dt className="text-muted-foreground">{copy.totalBookings}</dt>
            <dd className="font-medium text-foreground">{bookingCount}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{copy.emailLabel}</dt>
            <dd className="truncate font-medium text-foreground">{user?.email}</dd>
          </div>
        </dl>
      </AccountCard>

      <AccountCard>
        <h2 className="text-sm font-semibold text-[var(--logo-black)]">{copy.supportTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{messages.account.supportPage.subtitle}</p>
        <div className="mt-4 space-y-2">
          <WhatsAppSupportButton className="w-full justify-center rounded-xl py-3" />
          <Link
            to="/account/support"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-black/10 text-sm font-semibold text-[var(--logo-black)] transition-colors hover:bg-black/[0.03]"
          >
            <Headphones className="size-4" />
            {copy.contactUs}
          </Link>
        </div>
      </AccountCard>

      {showNewsletter ? (
        <AccountCard className="bg-[var(--logo-black)] text-white">
          <h2 className="text-sm font-semibold">{copy.newsletterTitle}</h2>
          <p className="mt-2 text-sm text-white/70">{copy.newsletterBody}</p>
          <Link
            to="/account/profile"
            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[var(--logo-black)] transition-colors hover:bg-white/90"
          >
            <Mail className="size-4" />
            {copy.newsletterCta}
          </Link>
        </AccountCard>
      ) : null}
    </div>
  );
}
