import { Link } from "@tanstack/react-router";

import { useI18n } from "@/i18n/provider";

import { useAuth } from "@/features/account/auth-provider";
import { MagicLinkForm } from "@/features/account/components/magic-link-form";
import { WhatsAppSupportButton } from "@/features/account/components/whatsapp-support-button";

type BookingAccountPromptProps = {
  guestEmail: string;
  bookingId: string;
};

export function BookingAccountPrompt({ guestEmail, bookingId }: BookingAccountPromptProps) {
  const { messages } = useI18n();
  const { user } = useAuth();
  const copy = messages.book.confirmation.manageAccount;

  if (user) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-primary/25 bg-primary/5 p-6 text-left">
        <p className="text-sm font-semibold text-foreground">{copy.signedIn}</p>
        <Link
          to="/account/bookings"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-[4px] bg-[var(--logo-red)] px-5 text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-[#c92228]"
        >
          {copy.viewAccount}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-white p-6 text-left shadow-[var(--shadow-sm)]">
      <h2 className="font-display text-lg font-bold text-[var(--logo-black)]">{copy.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.subtitle}</p>

      <div className="mt-5">
        <MagicLinkForm
          defaultEmail={guestEmail}
          emailLabel={copy.email}
          submitLabel={copy.submit}
          sentTitle={copy.sentTitle}
          sentBody={copy.sentBody}
          redirectPath={`/account/bookings?booking=${bookingId}`}
        />
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">{copy.help}</p>
        <WhatsAppSupportButton className="mt-3 w-full justify-center" />
      </div>
    </div>
  );
}
