"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { ThemeToggle } from "@/components/theme-toggle"
import { LocaleToggle } from "@/components/locale-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { User } from "lucide-react"

interface HeaderProps {
  user?: {
    email: string
    role?: string
  } | null
}

export function Header({ user }: HeaderProps) {
  const t = useTranslations("nav")
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
            P
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground">
            Parley
          </span>
        </Link>

        {/* Navigation */}
        {user && (
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("agents")}
            </Link>
            <Link
              href="/sessions"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("mySessions")}
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("admin")}
              </Link>
            )}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9 rounded-full">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                    {user.role === "admin" && (
                      <p className="text-xs leading-none text-muted-foreground">
                        Administrator
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Wyloguj się
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Zaloguj się</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Załóż konto</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
