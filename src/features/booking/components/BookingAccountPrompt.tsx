import { Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/i18n/provider";

import { sendMagicLink } from "@/features/account/auth";
import { useAuth } from "@/features/account/auth-provider";
import { WhatsAppSupportButton } from "@/features/account/components/whatsapp-support-button";

type BookingAccountPromptProps = {
  guestEmail: string;
  bookingId: string;
};

export function BookingAccountPrompt({ guestEmail, bookingId }: BookingAccountPromptProps) {
  const { messages } = useI18n();
  const { user } = useAuth();
  const copy = messages.book.confirmation.manageAccount;
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const sendAccountLink = async () => {
    if (loading || !guestEmail.trim()) return;
    setLoading(true);
    setError("");

    const result = await sendMagicLink(guestEmail, `/account/bookings?booking=${bookingId}`, {
      shouldCreateUser: true,
    });

    setLoading(false);
    if (!result.ok) {
      setError(messages.account.auth.login.sendError);
      return;
    }
    setSent(true);
  };

  if (user) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-primary/25 bg-primary/5 p-6 text-left">
        <p className="text-sm font-semibold text-foreground">{copy.signedIn}</p>
        <Link
          href={`/account/bookings?booking=${bookingId}`}
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-[4px] bg-[var(--logo-red)] px-5 text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-[#c92228]"
        >
          {copy.viewAccount}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-primary/25 bg-primary/5 p-6 text-left">
        <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
          <Mail className="size-5" />
        </span>
        <p className="mt-4 font-display text-lg font-bold text-foreground">{copy.sentTitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {copy.sentBody.replace("{email}", maskEmail(guestEmail))}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-white p-6 text-left shadow-[var(--shadow-sm)]">
      <h2 className="font-display text-lg font-bold text-[var(--logo-black)]">{copy.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.subtitle}</p>

      <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-background-secondary px-4 py-3">
        <Mail className="size-4 shrink-0 text-[var(--logo-red)]" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{copy.emailNotice}</p>
          <p className="truncate text-sm font-semibold text-foreground">{maskEmail(guestEmail)}</p>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <button
        type="button"
        onClick={() => void sendAccountLink()}
        disabled={loading || !guestEmail.trim()}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-[var(--logo-red)] px-5 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#c92228] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {copy.submit}
        {!loading ? <ArrowRight className="size-4" /> : null}
      </button>

      <div className="mt-5 border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">{copy.help}</p>
        <WhatsAppSupportButton className="mt-3 w-full justify-center" />
      </div>
    </div>
  );
}

function maskEmail(email: string) {
  const [local, domain] = email.trim().split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}
