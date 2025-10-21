import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/sessions/:id
 *
 * Returns detailed session information including:
 * - Session metadata
 * - Agent details
 * - Feedback/analysis
 * - Transcript
 * - User notes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    // Fetch session with agent details
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select(
        `
        id,
        user_id,
        status,
        started_at,
        ended_at,
        title_override,
        created_at,
        agents!inner (
          id,
          title,
          short_description,
          difficulty,
          language,
          thumbnail_path
        )
      `
      )
      .eq("id", id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Verify user owns this session
    if (session.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch feedback
    const { data: feedback } = await supabase
      .from("session_feedback")
      .select("*")
      .eq("session_id", id)
      .single();

    // Fetch transcript
    const { data: transcript } = await supabase
      .from("session_transcripts")
      .select("*")
      .eq("session_id", id)
      .single();

    // Fetch notes
    const { data: notes } = await supabase
      .from("session_notes")
      .select("*")
      .eq("session_id", id)
      .single();

    // Transform agent (from array to single object)
    const agent = Array.isArray(session.agents)
      ? session.agents[0]
      : session.agents;

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title_override || agent?.title || "Untitled",
        status: session.status,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        createdAt: session.created_at,
        agent: {
          id: agent?.id,
          title: agent?.title,
          description: agent?.short_description,
          difficulty: agent?.difficulty,
          language: agent?.language,
          thumbnailPath: agent?.thumbnail_path,
        },
      },
      feedback: feedback || null,
      transcript: transcript?.transcript || null,
      notes: notes?.notes_md || "",
    });
  } catch (error) {
    console.error("[API] Error fetching session details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sessions/:id
 *
 * Update session title
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Invalid title" },
        { status: 400 }
      );
    }

    // Update session
    const { error } = await supabase
      .from("sessions")
      .update({ title_override: title })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[API] Error updating session:", error);
      return NextResponse.json(
        { error: "Failed to update session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions/:id
 *
 * Delete session and all related data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    // Delete session (cascade will handle related data)
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[API] Error deleting session:", error);
      return NextResponse.json(
        { error: "Failed to delete session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
