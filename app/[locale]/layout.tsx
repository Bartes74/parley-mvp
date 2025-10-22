import type { CSSProperties } from "react"
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { parseSettings, DEFAULT_BRANDING, type BrandingSettings } from "@/lib/settings";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as 'pl' | 'en')) {
    notFound();
  }

  const messages = await getMessages();
  const supabase = await createClient();
  const { data: rawSettings } = await supabase
    .from("settings")
    .select("key, value");

  const { branding, landing } = parseSettings(rawSettings);
  const primaryColor = branding.primary_color || DEFAULT_BRANDING.primary_color;
  const cssVarStyles = createBrandingCssVars(branding);

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex min-h-screen flex-col" style={cssVarStyles}>
        <Header
          branding={branding}
          serviceName={landing.serviceName}
          primaryColor={primaryColor}
        />
        <main className="flex-1">{children}</main>
      </div>
    </NextIntlClientProvider>
  );
}

function createBrandingCssVars(branding: BrandingSettings): CSSProperties {
  const primary = branding.primary_color || DEFAULT_BRANDING.primary_color;
  const primaryForeground = getContrastColor(primary);

  return {
    "--primary": primary,
    "--primary-hover": `color-mix(in srgb, ${primary} 85%, black)`,
    "--primary-soft": `color-mix(in srgb, ${primary} 15%, white)`,
    "--primary-foreground": primaryForeground,
    "--ring": primary,
  } as CSSProperties;
}

function getContrastColor(hexColor: string): string {
  const normalized = hexColor.replace("#", "");

  const bigint = parseInt(normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized, 16);

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  return luminance > 0.55 ? "#0F1115" : "#FFFFFF";
}
