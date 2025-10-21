import { createBrowserClient } from "@supabase/ssr"

type CreateClientOptions = Parameters<typeof createBrowserClient>[2]

export function createClient(options?: CreateClientOptions) {
  const isBrowser = typeof window !== "undefined"

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...options,
      auth: {
        flowType: "pkce",
        autoRefreshToken: isBrowser,
        detectSessionInUrl: isBrowser,
        persistSession: true,
        ...(options?.auth ?? {}),
      },
    }
  )
}
