import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/sessions/my
 *
 * Returns list of user's sessions with agent details
 * Ordered by created_at DESC (newest first)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch user's sessions with agent information
    const { data: sessions, error } = await supabase
      .from("sessions")
      .select(
        `
        id,
        status,
        started_at,
        ended_at,
        title_override,
        created_at,
        agents (
          id,
          title,
          difficulty,
          language
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API] Error fetching sessions:", error);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    // Transform data for frontend
    const transformedSessions = sessions.map((session) => ({
      id: session.id,
      title: session.title_override || session.agents?.title || "Untitled",
      agentTitle: session.agents?.title || "Unknown Agent",
      agentDifficulty: session.agents?.difficulty,
      agentLanguage: session.agents?.language,
      status: session.status,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      createdAt: session.created_at,
    }));

    return NextResponse.json({
      sessions: transformedSessions,
      total: transformedSessions.length,
    });
  } catch (error) {
    console.error("[API] Error processing sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
