"use client"

import * as React from "react"
import { useLocale } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import { locales } from "@/i18n"
import { Button } from "@/components/ui/button"

export function LocaleToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = () => {
    const newLocale = locale === 'pl' ? 'en' : 'pl'

    // Remove current locale from pathname
    const pathnameWithoutLocale = pathname.replace(/^\/(pl|en)/, '') || '/'

    // Navigate to new locale
    router.push(`/${newLocale}${pathnameWithoutLocale}`)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLocale}
      className="h-9 px-3 font-medium"
    >
      {locale === 'pl' ? 'EN' : 'PL'}
    </Button>
  )
}
