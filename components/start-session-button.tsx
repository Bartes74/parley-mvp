"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface StartSessionButtonProps {
  agentId: string
  userId: string
  agentTitle: string
}

export function StartSessionButton({
  agentId,
  userId,
  agentTitle,
}: StartSessionButtonProps) {
  const [isStarting, setIsStarting] = useState(false)
  const router = useRouter()

  const handleStart = async () => {
    setIsStarting(true)

    try {
      const response = await fetch("/api/sessions/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agentId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to start session")
      }

      const { sessionId } = await response.json()

      // Redirect to conversation page with ElevenLabs widget
      router.push(`/sessions/${sessionId}/conversation`)
    } catch (error) {
      console.error("Error starting session:", error)
      toast.error(
        error instanceof Error ? error.message : "Nie udało się rozpocząć sesji"
      )
      setIsStarting(false)
    }
  }

  return (
    <Button
      size="lg"
      className="w-full"
      onClick={handleStart}
      disabled={isStarting}
    >
      {isStarting ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Rozpoczynanie...
        </>
      ) : (
        "START"
      )}
    </Button>
  )
}
