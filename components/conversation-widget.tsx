"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { toast } from "sonner"
import type { ElevenLabsConversation } from "@/types/elevenlabs"

interface ConversationWidgetProps {
  sessionId: string
  elevenAgentId: string
  userId: string
  agentDbId: string
}

export function ConversationWidget({
  sessionId,
  elevenAgentId,
  userId,
  agentDbId,
}: ConversationWidgetProps) {
  const router = useRouter()
  const conversationRef = useRef<ElevenLabsConversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    // Load ElevenLabs SDK
    const script = document.createElement("script")
    script.src = "https://elevenlabs.io/convai-widget/index.js"
    script.async = true
    script.onload = initializeConversation
    script.onerror = () => {
      toast.error("Nie udało się załadować widżetu konwersacji")
      setIsLoading(false)
    }
    document.body.appendChild(script)

    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(console.error)
      }
      document.body.removeChild(script)
    }
  }, [])

  const initializeConversation = async () => {
    try {
      if (!window.Elevenlabs) {
        throw new Error("ElevenLabs SDK not loaded")
      }

      const conversation = new window.Elevenlabs.Conversation({
        agentId: elevenAgentId,
        onConnect: () => {
          console.log("Connected to ElevenLabs")
          setIsConnected(true)
          setIsLoading(false)
        },
        onDisconnect: () => {
          console.log("Disconnected from ElevenLabs")
          setIsConnected(false)
          // Redirect to sessions list after disconnect
          setTimeout(() => {
            router.push("/sessions")
          }, 2000)
        },
        onError: (error) => {
          console.error("ElevenLabs error:", error)
          toast.error("Wystąpił błąd podczas rozmowy")
          setIsLoading(false)
        },
        onMessage: (message) => {
          console.log("Message:", message)
        },
      })

      conversationRef.current = conversation

      // Start session with dynamic variables
      await conversation.startSession({
        user_id: userId,
        session_id: sessionId,
        agent_db_id: agentDbId,
      })
    } catch (error) {
      console.error("Error initializing conversation:", error)
      toast.error("Nie udało się rozpocząć rozmowy")
      setIsLoading(false)
    }
  }

  const handleEndConversation = async () => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession()
        toast.success("Rozmowa zakończona")
        router.push("/sessions")
      } catch (error) {
        console.error("Error ending conversation:", error)
        toast.error("Nie udało się zakończyć rozmowy")
      }
    }
  }

  const toggleMute = () => {
    if (conversationRef.current) {
      const newVolume = isMuted ? 1 : 0
      conversationRef.current.setVolume(newVolume)
      setIsMuted(!isMuted)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Łączenie z agentem...
                </span>
              </>
            ) : isConnected ? (
              <>
                <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Połączono
                </span>
              </>
            ) : (
              <>
                <div className="size-3 rounded-full bg-gray-400" />
                <span className="text-sm text-muted-foreground">
                  Rozłączono
                </span>
              </>
            )}
          </div>

          {isConnected && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="size-9"
              >
                {isMuted ? (
                  <VolumeX className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Widget Container */}
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border bg-muted/30 p-8">
          {isLoading ? (
            <div className="text-center">
              <Loader2 className="mx-auto size-12 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">
                Przygotowywanie rozmowy...
              </p>
            </div>
          ) : isConnected ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10">
                <Mic className="size-10 text-primary" />
              </div>
              <p className="text-lg font-medium">Rozmowa w trakcie</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Mów naturalnie z agentem
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground">
                Rozmowa zakończona
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {isConnected && (
          <div className="flex justify-center">
            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndConversation}
            >
              Zakończ rozmowę
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="rounded-lg bg-primary-soft p-4 text-sm">
          <p className="font-medium text-primary">
            ℹ️ Informacja
          </p>
          <p className="mt-1 text-muted-foreground">
            Po zakończeniu rozmowy otrzymasz szczegółowy feedback i transkrypcję.
            Może to potrwać kilka minut.
          </p>
        </div>
      </div>
    </Card>
  )
}
