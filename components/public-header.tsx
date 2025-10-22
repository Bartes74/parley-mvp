import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";

export async function PublicHeader() {
  const supabase = await createClient();

  // Fetch branding settings for logo
  const { data: settings } = await supabase
    .from("settings")
    .select("key, value")
    .eq("key", "branding")
    .single();

  const branding = settings?.value as { logo_path?: string | null; primary_color?: string } | undefined;
  const logoPath = branding?.logo_path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          {logoPath ? (
            <div className="relative h-10 w-auto">
              <Image
                src={
                  logoPath.startsWith('http')
                    ? logoPath
                    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${logoPath}`
                }
                alt="Logo"
                width={120}
                height={40}
                className="object-contain h-10 w-auto"
                priority
              />
            </div>
          ) : (
            <span className="text-xl font-semibold">Parley</span>
          )}
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
