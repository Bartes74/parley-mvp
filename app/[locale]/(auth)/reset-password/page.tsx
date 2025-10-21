"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

const PKCE_BACKUP_KEY = "parley.supabase.pkce"

type CodeVerifierCookie = { name: string; value: string }

function findCodeVerifierCookie(): CodeVerifierCookie | null {
  if (typeof document === "undefined") return null

  const entries = document.cookie.split("; ").filter(Boolean)

  for (const entry of entries) {
    if (!entry.includes("-code-verifier=")) continue

    const [name, ...rest] = entry.split("=")
    const value = rest.join("=")

    if (!name || !value) continue

    return { name, value }
  }

  return null
}

function backupCodeVerifierCookie() {
  if (typeof window === "undefined") return

  const cookie = findCodeVerifierCookie()
  if (!cookie) return

  try {
    window.localStorage.setItem(PKCE_BACKUP_KEY, JSON.stringify(cookie))
  } catch {
    // ignore storage errors
  }
}

export default function ResetPasswordPage() {
  const supabase = createClient()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) return

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()

    if (!email) {
      setError("Podaj adres e-mail.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/update-password`,
      }
    )

    if (resetError) {
      setError(resetError.message)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    setSuccessMessage(
      "Sprawdź skrzynkę e-mail. Wysłaliśmy instrukcję resetu hasła."
    )

    await new Promise((resolve) => setTimeout(resolve, 100))
    backupCodeVerifierCookie()
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
            <h1 className="text-2xl font-semibold">Reset hasła</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Wyślij link odzyskiwania hasła na swój adres e-mail.
        </p>
      </header>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="jan.kowalski@example.com"
            autoComplete="email"
            required
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {successMessage ? (
          <p className="text-sm text-emerald-600" role="status">
            {successMessage}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
        </Button>
      </form>

      <footer className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Wróć do logowania
        </Link>
      </footer>
    </div>
  )
}
