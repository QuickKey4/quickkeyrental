import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";

import { linkBookingsToUser } from "@/features/account/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Search = {
  redirect?: string;
};

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth/callback" });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      void navigate({ to: "/account/login", replace: true });
      return;
    }

    const complete = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          void navigate({ to: "/account/login", replace: true });
          return;
        }
        await linkBookingsToUser();
      }

      const { data } = await supabase.auth.getSession();
      const target = redirect && redirect.startsWith("/") ? redirect : "/account";

      if (data.session) {
        void navigate({ href: target, replace: true });
      } else {
        void navigate({ to: "/account/login", search: { redirect: target }, replace: true });
      }
    };

    void complete();
  }, [navigate, redirect]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="size-8 animate-spin rounded-full border-2 border-[var(--logo-red)] border-t-transparent" />
    </div>
  );
}
