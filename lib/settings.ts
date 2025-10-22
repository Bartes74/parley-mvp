export interface SettingsRow {
  key: string
  // Supabase returns JSON as unknown
  value: Record<string, unknown> | null
}

export interface BrandingSettings {
  logo_path: string | null
  primary_color: string
}

export interface LandingSettings {
  serviceName: string
  headline: string
  subClaim: string
  lead: string
  cta_login: string
  cta_register: string
}

export interface ParsedSettings {
  branding: BrandingSettings
  landing: LandingSettings
}

export const DEFAULT_BRANDING: BrandingSettings = {
  logo_path: null,
  primary_color: "#0BA37F",
}

export const DEFAULT_LANDING: LandingSettings = {
  serviceName: "Parley",
  headline: "Trenuj rozmowy, które liczą się naprawdę",
  subClaim: "Ćwicz z agentami AI i otrzymuj szczegółowy feedback",
  lead: "Rozpocznij swoją podróż do perfekcji komunikacji",
  cta_login: "Zaloguj się",
  cta_register: "Utwórz konto",
}

export function parseSettings(rows: SettingsRow[] | null | undefined): ParsedSettings {
  const map = new Map<string, Record<string, unknown> | null>()

  rows?.forEach((row) => {
    if (row?.key) {
      map.set(row.key, row.value)
    }
  })

  const branding = {
    ...DEFAULT_BRANDING,
    ...(map.get("branding") as Partial<BrandingSettings> | undefined),
  }

  const landing = {
    ...DEFAULT_LANDING,
    ...(map.get("landing") as Partial<LandingSettings> | undefined),
  }

  return {
    branding,
    landing,
  }
}
