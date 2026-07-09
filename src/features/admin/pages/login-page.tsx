import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { BRAND } from "@/lib/brand";
import { contactHrefs } from "@/lib/contact-links";

import { useAdminAuth } from "../admin-auth-provider";
import { verifyAdminSecret } from "../api/admin.functions";
import { AdminCard } from "../components/admin-ui";
import { useAdminI18n } from "../hooks/use-admin-i18n";

type AdminLoginPageProps = {
  redirect?: string;
};

export function AdminLoginPage({ redirect }: AdminLoginPageProps) {
  const navigate = useNavigate();
  const { isAuthenticated, ready, signIn } = useAdminAuth();
  const { t, translateError } = useAdminI18n();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && isAuthenticated) {
      void navigate({ to: redirect ?? "/admin" });
    }
  }, [ready, isAuthenticated, navigate, redirect]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f0ee]">
        <div className="size-8 animate-spin rounded-full border-2 border-[var(--logo-red)] border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await verifyAdminSecret({ data: { secret: password } });
      signIn(password);
      void navigate({ to: redirect ?? "/admin" });
    } catch (err) {
      setError(
        err instanceof Error ? translateError(err.message) : t.login.invalidPassword,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f0ee] p-6">
      <AdminCard className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <Logo size="sm" className="mx-auto" />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--logo-red)]">
            {t.portal}
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold">{t.login.title}</h1>
        </div>

        <div className="rounded-xl border border-black/[0.06] bg-[#fafafa] px-4 py-3 text-sm leading-snug">
          <p className="font-semibold text-[var(--logo-black)]">{t.login.staffHeading}</p>
          <p className="mt-1 text-muted-foreground">{t.login.staffBody}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t.login.needAccess}{" "}
            <a
              href={contactHrefs.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--logo-red)] hover:underline"
            >
              {t.login.whatsappUs}
            </a>{" "}
            {t.login.orCall} {BRAND.phone}.
          </p>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-5 space-y-4">
          <label className="block text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.login.passwordLabel}
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.login.passwordPlaceholder}
              className="mt-1.5 h-11 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[var(--logo-red)]"
            />
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={submitting} className="min-w-[140px] flex-1" size="lg">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {t.login.submit}
            </Button>
            <Link
              to="/"
              className="inline-flex h-11 items-center px-4 text-sm text-muted-foreground hover:text-[var(--logo-black)]"
            >
              {t.login.backToSite}
            </Link>
          </div>
        </form>
      </AdminCard>
    </div>
  );
}
