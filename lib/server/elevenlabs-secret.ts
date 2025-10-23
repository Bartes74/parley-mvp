import { createClient } from "@supabase/supabase-js"

interface ElevenLabsSettingsValue {
  secret?: string | null
}

let serviceClient:
  | ReturnType<typeof createClient>
  | null = null

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return null
  }

  if (!serviceClient) {
    serviceClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
      },
    })
  }

  return serviceClient
}

/**
 * Returns the current ElevenLabs webhook secret.
 * Priority:
 * 1. Value stored in settings table (`elevenlabs.secret`)
 * 2. Fallback to environment variable `ELEVENLABS_WEBHOOK_SECRET`
 */
export async function getElevenLabsWebhookSecret(): Promise<string | null> {
  const fallback = process.env.ELEVENLABS_WEBHOOK_SECRET?.trim() || null

  const client = getServiceClient()
  if (!client) {
    return fallback
  }

  try {
    const { data, error } = await client
      .from("settings")
      .select("value")
      .eq("key", "elevenlabs")
      .maybeSingle()

    if (error) {
      if (error.code !== "PGRST116") {
        console.error("[Settings] Unable to read elevenlabs secret:", error)
      }
      return fallback
    }

    const secret =
      (data?.value as ElevenLabsSettingsValue | null)?.secret?.trim() || ""

    return secret || fallback
  } catch (err) {
    console.error("[Settings] Unexpected error fetching elevenlabs secret:", err)
    return fallback
  }
}
