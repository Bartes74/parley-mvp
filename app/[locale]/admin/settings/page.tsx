import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BrandingSettings } from "@/components/admin/branding-settings";
import { LandingSettings } from "@/components/admin/landing-settings";
import { EmailSettings } from "@/components/admin/email-settings";

export default async function AdminSettingsPage() {
  const t = await getTranslations("admin.settings");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/agents");
  }

  // Fetch all settings
  const { data: settings } = await supabase
    .from("settings")
    .select("key, value");

  // Transform array to object
  const settingsObject = settings?.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {} as Record<string, unknown>) || {};

  // Extract individual settings with defaults
  const brandingSettings = (settingsObject.branding as { logo_path: string | null; primary_color: string } | undefined) || {
    logo_path: null,
    primary_color: "#10b981",
  };

  const landingSettings = (settingsObject.landing as { headline: string; lead: string; cta_login: string; cta_register: string } | undefined) || {
    headline: "Parley",
    lead: "Platforma do treningu rozmów z AI",
    cta_login: "Zaloguj się",
    cta_register: "Utwórz konto",
  };

  const emailSettings = (settingsObject.email as { enabled: boolean; sender_name: string } | undefined) || {
    enabled: false,
    sender_name: "Parley",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground mt-2">
          Zarządzaj ustawieniami systemu: branding, landing page i powiadomienia e-mail
        </p>
      </div>

      <div className="space-y-6">
        <BrandingSettings initialSettings={brandingSettings} />
        <LandingSettings initialSettings={landingSettings} />
        <EmailSettings initialSettings={emailSettings} />
      </div>
    </div>
  );
}
