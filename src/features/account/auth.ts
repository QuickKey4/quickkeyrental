import type { AuthError } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type AuthResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function formatAuthError(error: AuthError | null): string {
  return error?.message ?? "Something went wrong. Please try again.";
}

function buildAuthRedirect(redirectPath?: string): string {
  const url = new URL("/auth/callback", window.location.origin);
  if (redirectPath) {
    url.searchParams.set("redirect", redirectPath);
  }
  return url.toString();
}

/** Magic link sign-in / sign-up (same flow — no passwords). */
export async function sendMagicLink(
  email: string,
  redirectPath?: string,
  options?: { shouldCreateUser?: boolean },
): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Account sign-in is not configured yet." };

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: buildAuthRedirect(redirectPath),
      shouldCreateUser: options?.shouldCreateUser ?? false,
    },
  });

  if (error) return { ok: false, error: formatAuthError(error) };
  return { ok: true, data: undefined };
}

/** Request email change — Supabase sends a verification link to the new address. */
export async function requestEmailChange(newEmail: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Email update is not configured yet." };

  const { error } = await supabase.auth.updateUser(
    { email: newEmail.trim() },
    { emailRedirectTo: buildAuthRedirect("/account/profile") },
  );

  if (error) return { ok: false, error: formatAuthError(error) };
  return { ok: true, data: undefined };
}

export async function signOut(): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Sign out is not configured yet." };

  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: formatAuthError(error) };
  return { ok: true, data: undefined };
}

export async function linkBookingsToUser(): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Account linking is not configured yet." };

  const { error } = await supabase.rpc("link_bookings_to_user");
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}
