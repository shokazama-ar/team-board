import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_KEY
      ? { auth: { storageKey: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_KEY } }
      : undefined
  );
}
