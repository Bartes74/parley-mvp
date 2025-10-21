import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ConversationWidget } from "@/components/conversation-widget"

interface ConversationPageProps {
  params: {
    id: string
    locale: string
  }
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch session details
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select(`
      *,
      agents (
        id,
        title,
        eleven_agent_id
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (sessionError || !session) {
    notFound()
  }

  // Make sure we have the agent data
  const agent = Array.isArray(session.agents) ? session.agents[0] : session.agents

  if (!agent || !agent.eleven_agent_id) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">{agent.title}</h1>
          <p className="text-muted-foreground">
            Rozmowa w trakcie... Po zakończeniu otrzymasz szczegółowy feedback.
          </p>
        </div>

        {/* Conversation Widget */}
        <ConversationWidget
          sessionId={session.id}
          elevenAgentId={agent.eleven_agent_id}
          userId={user.id}
          agentDbId={agent.id}
        />
      </div>
    </div>
  )
}
