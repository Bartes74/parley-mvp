import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { agentId } = body

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      )
    }

    // Verify agent exists and is active
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, eleven_agent_id")
      .eq("id", agentId)
      .eq("is_active", true)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agent not found or inactive" },
        { status: 404 }
      )
    }

    // Create session record
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        agent_id: agentId,
        status: "pending",
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (sessionError || !session) {
      console.error("Error creating session:", sessionError)
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      )
    }

    // Return session ID and agent configuration
    return NextResponse.json({
      sessionId: session.id,
      elevenAgentId: agent.eleven_agent_id,
      dynamicVariables: {
        user_id: user.id,
        session_id: session.id,
        agent_db_id: agentId,
      },
    })
  } catch (error) {
    console.error("Error in /api/sessions/start:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
