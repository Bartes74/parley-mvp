import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LandingLoginForm } from "@/components/landing-login-form"

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is logged in, redirect to agents catalog
  if (user) {
    redirect("/agents")
  }

  // Fetch all settings (same approach as admin settings page)
  const { data: allSettings } = await supabase
    .from("settings")
    .select("key, value");

  console.log("[Landing] All settings from DB:", allSettings);

  // Transform array to object
  const settingsObject = allSettings?.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {} as Record<string, unknown>) || {};

  console.log("[Landing] Settings object:", settingsObject);

  // Extract landing settings
  const landing = settingsObject.landing as {
    serviceName?: string;
    headline?: string;
    subClaim?: string;
    lead?: string;
    cta_login?: string;
    cta_register?: string;
  } | undefined;

  const serviceName = landing?.serviceName || "Parley";
  const headline = landing?.headline || "Trenuj rozmowy, które liczą się naprawdę";
  const subClaim = landing?.subClaim || "Ćwicz z agentami AI i otrzymuj szczegółowy feedback";
  const lead = landing?.lead || "Rozpocznij swoją podróż do perfekcji komunikacji";
  const ctaRegister = landing?.cta_register || "Utwórz konto";

  console.log("[Landing] Final values:", { serviceName, headline, subClaim, lead, ctaRegister });

  return (
    <div className="container mx-auto px-4 py-12 lg:py-24 max-w-7xl">
      <div className="grid gap-8 lg:grid-cols-[2fr,1fr] lg:gap-12">
        {/* Left side - Hero content (66%) */}
        <div className="flex flex-col justify-start space-y-6">
          <div className="space-y-4">
            {/* Headline - duża czcionka */}
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              {headline}
            </h1>
            {/* Sub-claim - średnia czcionka (jak poprzedni lead) */}
            <p className="text-xl text-muted-foreground sm:text-2xl lg:text-3xl max-w-2xl">
              {subClaim}
            </p>
            {/* Lead - mniejsza czcionka */}
            <p className="text-base text-muted-foreground sm:text-lg lg:text-xl max-w-2xl">
              {lead}
            </p>
          </div>

          <div>
            <Button asChild size="lg" className="text-lg px-8 py-6 h-auto">
              <Link href="/register">{ctaRegister}</Link>
            </Button>
          </div>
        </div>

        {/* Right side - Login form (33%) - na wysokości nagłówka */}
        <div>
          <LandingLoginForm />
        </div>
      </div>
    </div>
  )
}
