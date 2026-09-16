import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { getSupabaseEnv } from "@/lib/supabase/env";

export function createClientSupabaseClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();

  return createBrowserClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
  );
}
