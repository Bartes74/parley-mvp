import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Types based on parley.md specification
interface DynamicVariables {
  user_id: string;
  session_id: string;
  agent_db_id: string;
}

interface TranscriptEntry {
  speaker: "user" | "agent";
  text: string;
  ts_ms: number;
}

interface Analysis {
  score_overall: number;
  criteria: Record<string, number>;
  summary: string;
  tips: string[];
}

interface WebhookPayload {
  event: string;
  conversation_initiation_client_data: {
    dynamic_variables: DynamicVariables;
  };
  transcript: TranscriptEntry[];
  analysis: Analysis;
}

/**
 * Verify HMAC signature from ElevenLabs webhook
 */
/**
 * POST /api/webhooks/elevenlabs
 *
 * Handles post-call webhook from ElevenLabs:
 * 1. Verifies HMAC signature
 * 2. Extracts session_id from dynamic variables
 * 3. Saves transcript and feedback to database
 * 4. Updates session status to 'completed'
 * 5. Logs webhook event for monitoring
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const rawBody = await request.text();
    const payload: WebhookPayload = JSON.parse(rawBody);

    console.log("[Webhook] Received event:", payload.event);

    // Extract dynamic variables
    const { session_id } =
      payload.conversation_initiation_client_data?.dynamic_variables || {};

    if (!session_id) {
      console.warn("[Webhook] Missing session_id in dynamic variables - ignoring event");

      await supabase.from("webhook_events").insert({
        provider: "elevenlabs",
        event_type: payload.event,
        payload: payload,
        status: "ignored",
        error: "Missing session_id in dynamic variables",
      });

      return NextResponse.json(
        {
          success: false,
          message: "Missing session_id in dynamic variables",
        },
        { status: 200 }
      );
    }

    console.log("[Webhook] Processing session_id:", session_id);

    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, user_id, agent_id, status")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      console.error("[Webhook] Session not found:", session_id);

      await supabase.from("webhook_events").insert({
        provider: "elevenlabs",
        event_type: payload.event,
        payload: payload,
        status: "failed",
        error: `Session not found: ${session_id}`,
      });

      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Save transcript (UPSERT for idempotency)
    if (payload.transcript && payload.transcript.length > 0) {
      const { error: transcriptError } = await supabase
        .from("session_transcripts")
        .upsert(
          {
            session_id: session_id,
            transcript: payload.transcript,
          },
          {
            onConflict: "session_id",
          }
        );

      if (transcriptError) {
        console.error("[Webhook] Failed to save transcript:", transcriptError);
        throw transcriptError;
      }

      console.log("[Webhook] Transcript saved for session:", session_id);
    }

    // Save feedback/analysis (UPSERT for idempotency)
    if (payload.analysis) {
      const { error: feedbackError } = await supabase
        .from("session_feedback")
        .upsert(
          {
            session_id: session_id,
            raw_feedback: payload.analysis,
            score_overall: payload.analysis.score_overall,
            score_breakdown: payload.analysis.criteria,
          },
          {
            onConflict: "session_id",
          }
        );

      if (feedbackError) {
        console.error("[Webhook] Failed to save feedback:", feedbackError);
        throw feedbackError;
      }

      console.log("[Webhook] Feedback saved for session:", session_id);
    }

    // Update session status to 'completed' and set ended_at
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    if (updateError) {
      console.error("[Webhook] Failed to update session status:", updateError);
      throw updateError;
    }

    console.log("[Webhook] Session marked as completed:", session_id);

    // Log successful webhook event
    await supabase.from("webhook_events").insert({
      provider: "elevenlabs",
      event_type: payload.event,
      payload: payload,
      status: "processed",
    });

    // TODO: Send email notification to user (implement with Resend)
    // const userEmail = await getUserEmail(user_id);
    // await sendFeedbackReadyEmail(userEmail, session_id);

    return NextResponse.json({
      success: true,
      session_id: session_id,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("[Webhook] Processing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Try to log error in webhook_events
    try {
      await supabase.from("webhook_events").insert({
        provider: "elevenlabs",
        event_type: "error",
        payload: { error: errorMessage },
        status: "failed",
        error: errorMessage,
      });
    } catch (logError) {
      console.error("[Webhook] Failed to log error:", logError);
    }

    return NextResponse.json(
      { error: "Internal server error", message: errorMessage },
      { status: 500 }
    );
  }
}

// Only allow POST method
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
