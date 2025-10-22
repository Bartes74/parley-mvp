import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PublicHeader } from "@/components/public-header"
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

  // Fetch landing page settings
  const { data: settings } = await supabase
    .from("settings")
    .select("key, value")
    .eq("key", "landing")
    .single();

  const landing = settings?.value as {
    headline?: string;
    lead?: string;
    cta_login?: string;
    cta_register?: string;
  } | undefined;

  const headline = landing?.headline || "Parley";
  const lead = landing?.lead || "Platforma do treningu rozmów z AI";
  const ctaRegister = landing?.cta_register || "Utwórz konto";

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-start">
            {/* Left side - Hero content */}
            <div className="flex flex-col justify-start space-y-8 lg:py-12">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                  {headline}
                </h1>
                <p className="text-xl text-muted-foreground sm:text-2xl lg:text-3xl max-w-2xl">
                  {lead}
                </p>
              </div>

              <div>
                <Button asChild size="lg" className="text-lg px-8 py-6 h-auto">
                  <Link href="/register">{ctaRegister}</Link>
                </Button>
              </div>
            </div>

            {/* Right side - Login form */}
            <div className="lg:py-12">
              <LandingLoginForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
