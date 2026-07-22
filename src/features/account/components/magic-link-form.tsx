"use client";

import { Loader2, Mail } from "lucide-react";
import { useState } from "react";

import { sendMagicLink } from "../auth";

type MagicLinkFormProps = {
  defaultEmail?: string;
  emailLabel: string;
  submitLabel: string;
  sentTitle: string;
  sentBody: string;
  errorLabel: string;
  redirectPath?: string;
  shouldCreateUser?: boolean;
  onSent?: () => void;
};

export function MagicLinkForm({
  defaultEmail = "",
  emailLabel,
  submitLabel,
  sentTitle,
  sentBody,
  errorLabel,
  redirectPath,
  shouldCreateUser = true,
  onSent,
}: MagicLinkFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await sendMagicLink(email, redirectPath, { shouldCreateUser });
    setLoading(false);

    if (!result.ok) {
      setError(errorLabel);
      return;
    }

    setSent(true);
    onSent?.();
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-left sm:p-5">
        <p className="font-semibold text-foreground">{sentTitle}</p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground sm:text-sm">
          {sentBody}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {emailLabel}
        </span>
        <span className="flex h-12 min-w-0 items-center gap-3 rounded-xl border border-border bg-background-secondary px-4 focus-within:border-[var(--logo-red)]">
          <Mail className="size-4 shrink-0 text-[var(--logo-red)]" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="min-w-0 flex-1 bg-transparent text-base outline-none"
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
        {submitLabel}
      </button>
    </form>
  );
}
