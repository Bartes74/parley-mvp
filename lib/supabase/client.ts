import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const isBrowser = typeof window !== "undefined"

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
        autoRefreshToken: isBrowser,
        detectSessionInUrl: isBrowser,
        persistSession: true,
      },
    }
  )
}
