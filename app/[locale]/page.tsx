import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LandingLoginForm } from "@/components/landing-login-form"
import { parseSettings, DEFAULT_BRANDING } from "@/lib/settings"

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

  const { branding, landing } = parseSettings(allSettings);

  const primaryColor = branding.primary_color || DEFAULT_BRANDING.primary_color;
  const headline = landing.headline;
  const subClaim = landing.subClaim;
  const lead = landing.lead;
  const ctaRegister = landing.cta_register;

  console.log("[Landing] Final values:", { serviceName: landing.serviceName, headline, subClaim, lead, ctaRegister });

  return (
    <div className="container mx-auto px-4 py-12 lg:py-24 max-w-7xl">
      <div className="grid gap-10 lg:grid-cols-3 lg:items-start">
        {/* Left side - Hero content (66%) */}
        <div className="flex flex-col justify-start space-y-8 lg:col-span-2">
          <div className="space-y-6 lg:space-y-8">
            {/* Headline - duża czcionka */}
            <h1
              className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
              style={{ color: primaryColor }}
            >
              {headline}
            </h1>
            {/* Sub-claim - średnia czcionka (jak poprzedni lead) */}
            <p className="max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl lg:text-3xl">
              {subClaim}
            </p>
            {/* Lead - mniejsza czcionka */}
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
              {lead}
            </p>
          </div>

          <div className="pt-2">
            <Button asChild size="lg" className="h-auto px-8 py-6 text-lg">
              <Link href="/register">{ctaRegister}</Link>
            </Button>
          </div>
        </div>

        {/* Right side - Login form (33%) - na wysokości nagłówka */}
        <div className="w-full lg:col-span-1 lg:self-start">
          <LandingLoginForm />
        </div>
      </div>
    </div>
  )
}
