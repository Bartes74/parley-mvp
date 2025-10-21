"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "./theme-toggle";
import { LocaleToggle } from "./locale-toggle";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface HeaderProps {
  user: {
    email: string;
    role: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const t = useTranslations("common");
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">Parley</span>
          </Link>
          {user && (
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
              {user.role === "admin" && (
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
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden md:inline">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                {t("auth.signOut")}
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm">
                {t("auth.signIn")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
