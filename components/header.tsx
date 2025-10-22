"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "./theme-toggle";
import { LocaleToggle } from "./locale-toggle";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { User } from "@supabase/supabase-js";
import type { BrandingSettings } from "@/lib/settings";

interface UserProfile {
  email: string;
  role: string;
}

interface HeaderProps {
  branding: BrandingSettings;
  serviceName: string;
  primaryColor: string;
}

export function Header({ branding, serviceName, primaryColor }: HeaderProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if we're on landing page (root path)
  const isLandingPage = pathname === "/" || pathname === "/pl" || pathname === "/en";
  const logoUrl = useMemo(() => {
    if (!branding.logo_path) return null;

    return branding.logo_path.startsWith("http")
      ? branding.logo_path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${branding.logo_path}`;
  }, [branding.logo_path]);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user }, error: authError }) => {
      console.log("[Header] Auth user:", user, "Error:", authError);
      setUser(user);
      if (user) {
        // Fetch profile
        supabase
          .from("profiles")
          .select("email, role")
          .eq("id", user.id)
          .single()
          .then(({ data, error }) => {
            console.log("[Header] Profile data:", data, "Error:", error);
            if (data) {
              setProfile(data);
            } else if (user.email) {
              // Fallback: use email from auth user
              setProfile({ email: user.email, role: "user" });
            }
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[Header] Auth state changed:", _event, "User:", session?.user);
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("email, role")
          .eq("id", session.user.id)
          .single()
          .then(({ data, error }) => {
            console.log("[Header] Profile on auth change:", data, "Error:", error);
            if (data) {
              setProfile(data);
            } else if (session.user.email) {
              // Fallback
              setProfile({ email: session.user.email, role: "user" });
            }
          });
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            {logoUrl ? (
              <span className="relative h-10 w-auto">
                <Image
                  src={logoUrl}
                  alt={serviceName}
                  width={120}
                  height={40}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </span>
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary-foreground">
                {serviceName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-lg font-semibold" style={{ color: primaryColor }}>
              {serviceName}
            </span>
          </Link>
          {user && !isLoading && (
            <nav className="flex items-center gap-4">
              <Link href="/agents">
                <Button variant="ghost" size="sm">
                  {t("nav.agents")}
                </Button>
              </Link>
              <Link href="/sessions">
                <Button variant="ghost" size="sm">
                  {t("nav.mySessions")}
                </Button>
              </Link>
              {profile?.role === "admin" && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    {t("nav.admin")}
                  </Button>
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleToggle />
          {!isLoading && (
            <>
              {user && profile ? (
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {profile.email}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    {t("auth.signOut")}
                  </Button>
                </div>
              ) : (
                // Don't show "Zaloguj się" button on landing page (login form is there)
                !isLandingPage && (
                  <Link href="/login">
                    <Button variant="default" size="sm">
                      {t("auth.signIn")}
                    </Button>
                  </Link>
                )
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
