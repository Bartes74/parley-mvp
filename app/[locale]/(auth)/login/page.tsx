"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registrationSuccess = searchParams.get("registered") === "1"
  const passwordResetSuccess = searchParams.get("reset") === "success"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) return

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    if (!email || !password) {
      setError("Podaj adres e-mail i hasło.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setIsSubmitting(false)
      return
    }

    router.push("/")
    router.refresh()
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
            <h1 className="text-2xl font-semibold">Panel logowania</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Zaloguj się, aby zarządzać treningami rozmów i agentami.
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Hasło</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {(registrationSuccess || passwordResetSuccess) ? (
          <div className="space-y-1 text-sm text-emerald-600" role="status">
            {registrationSuccess ? (
              <p>Konto zostało utworzone. Możesz się zalogować.</p>
            ) : null}
            {passwordResetSuccess ? (
              <p>Hasło zostało zaktualizowane. Zaloguj się ponownie.</p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logowanie..." : "Zaloguj się"}
        </Button>
      </form>

      <footer className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
        <div>
          Nie masz konta?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Utwórz konto
          </Link>
        </div>
        <div>
          <Link
            href="/reset-password"
            className="font-medium text-primary hover:underline"
          >
            Zapomniałeś hasła?
          </Link>
        </div>
      </footer>
    </div>
  )
}
