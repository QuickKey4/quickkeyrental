"use client";

import { Loader2, Mail } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { useI18n } from "@/i18n/provider";

import { lookupEmailForLogin } from "../api/account.functions";
import { sendMagicLink } from "../auth";
import { MagicLinkForm } from "./magic-link-form";

type LoginEmailFlowProps = {
  redirectPath?: string;
};

type Step = "email" | "existing_account" | "bookings_only" | "not_found" | "sent";

export function LoginEmailFlow({ redirectPath = "/account" }: LoginEmailFlowProps) {
  const { messages } = useI18n();
  const copy = messages.account.auth.login;

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [bookingCount, setBookingCount] = useState(0);
  const [linkedOnCreate, setLinkedOnCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await lookupEmailForLogin({ data: { email: email.trim() } });
      setBookingCount(result.bookingCount);

      if (result.status === "existing_account") {
        setStep("existing_account");
      } else if (result.status === "bookings_only") {
        setStep("bookings_only");
      } else {
        setStep("not_found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.lookupError);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async (shouldCreateUser: boolean) => {
    setError("");
    setLoading(true);

    const result = await sendMagicLink(email, redirectPath, { shouldCreateUser });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setLinkedOnCreate(shouldCreateUser);
    setStep("sent");
  };

  if (step === "sent") {
    const sentBody = linkedOnCreate ? copy.sentBodyLinked : copy.sentBody;

    return (
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-5 text-left">
        <p className="font-semibold text-foreground">{copy.sentTitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{sentBody}</p>
      </div>
    );
  }

  if (step === "existing_account") {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-border bg-background-secondary/50 p-4 text-sm leading-relaxed text-muted-foreground">
          {bookingCount > 0 ? copy.existingWithBookings : copy.existingAccount}
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSendMagicLink(false)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-[var(--logo-red)] text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-[#c92228] disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {copy.sendMagicLink}
        </button>
        <button
          type="button"
          onClick={() => setStep("email")}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {copy.useDifferentEmail}
        </button>
      </div>
    );
  }

  if (step === "bookings_only") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--logo-red)]/20 bg-[var(--logo-red)]/5 p-4">
          <p className="text-sm font-semibold text-[var(--logo-black)]">{copy.bookingsFoundTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {copy.bookingsFoundBody.replace("{count}", String(bookingCount))}
          </p>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSendMagicLink(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-[var(--logo-red)] text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-[#c92228] disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {copy.createAccount}
        </button>
        <p className="text-xs leading-relaxed text-muted-foreground">{copy.createAccountHint}</p>
        <button
          type="button"
          onClick={() => setStep("email")}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {copy.useDifferentEmail}
        </button>
      </div>
    );
  }

  if (step === "not_found") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-dashed border-border p-5 text-center">
          <p className="text-sm font-semibold text-[var(--logo-black)]">{copy.noBookingTitle}</p>
          <p className="mt-2 text-sm text-muted-foreground">{copy.noBookingBody}</p>
        </div>
        <Link
          to="/book"
          className="flex h-12 w-full items-center justify-center rounded-[4px] bg-[var(--logo-red)] text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-[#c92228]"
        >
          {copy.bookACar}
        </Link>
        <button
          type="button"
          onClick={() => setStep("email")}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {copy.useDifferentEmail}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleContinue(event)} className="space-y-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {copy.email}
        </span>
        <span className="flex h-12 items-center gap-3 rounded-xl border border-border bg-background-secondary px-4 focus-within:border-[var(--logo-red)]">
          <Mail className="size-4 shrink-0 text-[var(--logo-red)]" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </span>
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-[var(--logo-red)] text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-[#c92228] disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {copy.continue}
      </button>
    </form>
  );
}
