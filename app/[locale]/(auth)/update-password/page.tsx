"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

const PKCE_BACKUP_KEY = "parley.supabase.pkce"
const COOKIE_MAX_AGE = 400 * 24 * 60 * 60

type CodeVerifierCookie = { name: string; value: string }

function findCodeVerifierCookies(): CodeVerifierCookie[] {
  if (typeof document === "undefined") return []

  return document.cookie
    .split("; ")
    .filter(Boolean)
    .map((entry) => {
      const [name, ...rest] = entry.split("=")
      const value = rest.join("=")
      return { name, value }
    })
    .filter(
      (cookie): cookie is CodeVerifierCookie =>
        Boolean(cookie.name) &&
        Boolean(cookie.value) &&
        cookie.name.includes("-code-verifier"),
    )
}

function restoreCodeVerifierCookiesFromBackup() {
  if (typeof window === "undefined") return

  const existing = findCodeVerifierCookies()
  if (existing.length > 0) return

  try {
    const raw = window.localStorage.getItem(PKCE_BACKUP_KEY)
    if (!raw) return

    const parsed = JSON.parse(raw) as CodeVerifierCookie[]

    if (!Array.isArray(parsed) || !parsed.length) return

    parsed.forEach((cookie) => {
      if (!cookie?.name || !cookie?.value) return
      document.cookie = `${cookie.name}=${cookie.value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
    })
  } catch {
    // ignore restore errors
  }
}

function clearCodeVerifierBackup() {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(PKCE_BACKUP_KEY)
  } catch {
    // ignore storage errors
  }
}

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = useMemo(
    () => createClient({ auth: { detectSessionInUrl: false } }),
    []
  )

  const [isExchanging, setIsExchanging] = useState(true)
  const [exchangeError, setExchangeError] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function prepareSession() {
      restoreCodeVerifierCookiesFromBackup()

      const search = new URLSearchParams(window.location.search)
      const hash = window.location.hash.startsWith("#")
        ? new URLSearchParams(window.location.hash.slice(1))
        : new URLSearchParams()

      const code = search.get("code") ?? hash.get("code")
      const tokenHash = search.get("token_hash") ?? hash.get("token_hash")
      const type = search.get("type") ?? hash.get("type")

      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        })

        if (error) {
          setExchangeError(error.message)
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          setExchangeError(error.message)
        }
      } else if (type === "recovery") {
        setExchangeError("Brakuje danych uwierzytelniających w linku resetującym.")
      } else {
        setExchangeError("Nieprawidłowy link resetujący.")
      }

      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete("code")
      cleanUrl.searchParams.delete("token_hash")
      cleanUrl.searchParams.delete("type")
      window.history.replaceState(window.history.state, "", cleanUrl.toString())

      window.location.hash = ""
      setIsExchanging(false)
    }

    void prepareSession()
  }, [supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting || exchangeError) return

    const formData = new FormData(event.currentTarget)
    const password = String(formData.get("password") ?? "")
    const confirmPassword = String(formData.get("confirmPassword") ?? "")

    if (!password || password.length < 8) {
      setError("Hasło powinno mieć co najmniej 8 znaków.")
      return
    }

    if (password !== confirmPassword) {
      setError("Hasła muszą być takie same.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    clearCodeVerifierBackup()
    router.push("/login?reset=success")
    router.refresh()
  }

  if (isExchanging) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">Trwa przygotowywanie resetu hasła…</p>
      </div>
    )
  }

  if (exchangeError) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-destructive">{exchangeError}</p>
        <Link href="/reset-password" className="text-sm font-medium text-primary hover:underline">
          Poproś o nowy link resetujący
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            P
          </span>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Parley
            </p>
            <h1 className="text-2xl font-semibold">Ustaw nowe hasło</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Wprowadź nowe hasło, aby zakończyć reset.
        </p>
      </header>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Nowe hasło</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Powtórz hasło</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Zapisywanie..." : "Zapisz nowe hasło"}
        </Button>
      </form>
    </div>
  )
}
