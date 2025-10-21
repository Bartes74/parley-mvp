declare global {
  interface Window {
    Elevenlabs?: {
      Conversation: new (config: ElevenLabsConversationConfig) => ElevenLabsConversation
    }
  }
}

export interface ElevenLabsConversationConfig {
  agentId: string
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  onMessage?: (message: any) => void
  onModeChange?: (mode: { mode: string }) => void
  clientTools?: Record<string, any>
  overrides?: {
    agent?: {
      prompt?: {
        prompt?: string
      }
      firstMessage?: string
      language?: string
    }
    tts?: {
      voiceId?: string
    }
  }
}

export interface ElevenLabsConversation {
  startSession: (variables?: Record<string, any>) => Promise<string>
  endSession: () => Promise<void>
  setVolume: (volume: number) => void
  getInputVolume: () => number
  getInputFrequency: () => number
}

export {}
