import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

let serverClient: SupabaseClient<Database> | null | undefined;

export function getSupabaseAdminClient(): SupabaseClient<Database> {
  if (serverClient) return serverClient;

  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const apiKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!url || !apiKey) {
    throw new Error(
      "Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  serverClient = createClient<Database>(url, apiKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return serverClient;
}
