"use client"

import { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-12">
        {children}
      </div>
    </div>
  )
}
