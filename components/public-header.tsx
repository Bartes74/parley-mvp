import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { createClient } from "@/lib/supabase/server";
import { parseSettings, DEFAULT_BRANDING } from "@/lib/settings";

export async function PublicHeader() {
  const supabase = await createClient();

  const { data: rawSettings } = await supabase
    .from("settings")
    .select("key, value");

  const { branding, landing } = parseSettings(rawSettings);
  const logoPath = branding.logo_path;
  const primaryColor = branding.primary_color || DEFAULT_BRANDING.primary_color;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          {logoPath ? (
            <div className="relative h-10 w-auto">
              <Image
                src={
                  logoPath.startsWith("http")
                    ? logoPath
                    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${logoPath}`
                }
                alt={landing.serviceName}
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary-foreground">
              {landing.serviceName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="text-lg font-semibold" style={{ color: primaryColor }}>
            {landing.serviceName}
          </span>
        </Link>

        {/* Right side - Theme toggle and Language */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleToggle />
        </div>
      </div>
    </header>
  );
}
