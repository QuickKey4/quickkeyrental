import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/i18n/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { useAuth } from "../auth-provider";

export function SettingsPage() {
  const { messages } = useI18n();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const copy = messages.account.settings;

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/" });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== copy.deletePhrase) {
      setDeleteError(copy.deletePhraseError);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setDeleteError(copy.deleteError);
      return;
    }

    setDeleting(true);
    setDeleteError("");

    const { error } = await supabase.rpc("delete_user_account");
    setDeleting(false);

    if (error) {
      setDeleteError(error.message);
      return;
    }

    await signOut();
    void navigate({ to: "/" });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold uppercase text-[var(--logo-black)]">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
      </header>

      <section className="max-w-xl rounded-2xl border border-border bg-white p-6">
        <h2 className="font-semibold text-[var(--logo-black)]">{copy.sessionTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{copy.sessionBody}</p>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-[4px] border border-border px-5 text-xs font-bold uppercase tracking-[0.1em] hover:bg-black/[0.03]"
        >
          <LogOut className="size-4" />
          {copy.signOut}
        </button>
      </section>

      <section className="max-w-xl rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="font-semibold text-destructive">{copy.deleteTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{copy.deleteBody}</p>
        <p className="mt-4 text-sm">
          {copy.deleteConfirmLabel}{" "}
          <strong className="text-foreground">{copy.deletePhrase}</strong>
        </p>
        <input
          type="text"
          value={deleteConfirm}
          onChange={(event) => setDeleteConfirm(event.target.value)}
          className="mt-3 h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-destructive"
          placeholder={copy.deletePhrase}
        />
        {deleteError ? <p className="mt-2 text-sm text-destructive">{deleteError}</p> : null}
        <button
          type="button"
          disabled={deleting}
          onClick={() => void handleDeleteAccount()}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-[4px] bg-destructive px-5 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-60"
        >
          {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
          {copy.deleteAccount}
        </button>
        <p className="mt-3 text-xs text-muted-foreground">
          {copy.deleteSupport}{" "}
          <Link to="/#contact" className="font-medium text-[var(--logo-red)] hover:underline">
            {copy.contactUs}
          </Link>
        </p>
      </section>
    </div>
  );
}
