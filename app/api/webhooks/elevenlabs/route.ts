import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Types based on parley.md specification
type ElevenLabsDynamicVariables = {
  user_id?: string | null;
  session_id?: string | null;
  agent_db_id?: string | null;
};

type ElevenLabsTranscriptEntry = {
  role?: string | null;
  message?: string | null;
  original_message?: string | null;
  timestamp?: string | null;
};

type ElevenLabsAnalysis = {
  score_overall?: number | null;
  criteria?: Record<string, number> | null;
  summary?: string | null;
  tips?: string[] | null;
  transcript_summary?: string | null;
  call_summary_title?: string | null;
};

type ElevenLabsPayloadData = {
  analysis?: ElevenLabsAnalysis | null;
  transcript?: ElevenLabsTranscriptEntry[] | null;
  conversation_initiation_client_data?: {
    dynamic_variables?: ElevenLabsDynamicVariables | null;
  } | null;
};

type ElevenLabsWebhookPayload = {
  type?: string;
  event_timestamp?: number;
  data?: ElevenLabsPayloadData | null;
};

/**
 * POST /api/webhooks/elevenlabs
 *
 * Handles post-call webhook from ElevenLabs:
 * 1. Odczytuje dynamic variables (session_id itd.)
 * 2. Zapisuje transkrypt oraz analizę, jeśli to możliwe
 * 3. Aktualizuje status rozmowy
 * 4. Loguje zdarzenie do tabeli webhook_events
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody) as ElevenLabsWebhookPayload;
    const payloadData = payload.data ?? {};

    console.log("[Webhook] Received event of type:", payload.type ?? "unknown");

    // Extract dynamic variables
    const dynamicVariables =
      payloadData.conversation_initiation_client_data?.dynamic_variables || {};
    const session_id = dynamicVariables.session_id || null;

    if (!session_id) {
      console.warn("[Webhook] Missing session_id in dynamic variables - ignoring event");

      await supabase.from("webhook_events").insert({
        provider: "elevenlabs",
        event_type: payload.type || "unknown",
        payload,
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
        event_type: payload.type || "unknown",
        payload,
        status: "failed",
        error: `Session not found: ${session_id}`,
      });

      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Save transcript (UPSERT for idempotency)
    if (payloadData.transcript && payloadData.transcript.length > 0) {
      const { error: transcriptError } = await supabase
        .from("session_transcripts")
        .upsert(
          {
            session_id: session_id,
            transcript: payloadData.transcript,
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
    if (payloadData.analysis) {
      const { error: feedbackError } = await supabase
        .from("session_feedback")
        .upsert(
          {
            session_id: session_id,
            raw_feedback: payloadData.analysis,
            score_overall: payloadData.analysis.score_overall ?? null,
            score_breakdown: payloadData.analysis.criteria ?? null,
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
      event_type: payload.type || "unknown",
      payload,
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
