import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { SessionHeader } from "@/components/session-detail/session-header";
import { SessionFeedback } from "@/components/session-detail/session-feedback";
import { SessionTranscript, type TranscriptMessage } from "@/components/session-detail/session-transcript";
import { SessionNotes } from "@/components/session-detail/session-notes";

type ElevenLabsAnalysis = {
  score_overall?: number | null;
  criteria?: Record<string, number> | null;
  transcript_summary?: string | null;
  call_summary_title?: string | null;
  tips?: string[] | null;
};

type ElevenLabsTranscriptEntry = {
  role?: string | null;
  message?: string | null;
  original_message?: string | null;
  timestamp?: string | null;
};

type StoredWebhookEvent = {
  payload: {
    analysis?: ElevenLabsAnalysis | null;
    transcript?: ElevenLabsTranscriptEntry[] | null;
    conversation_initiation_client_data?: {
      dynamic_variables?: {
        session_id?: string | null;
      } | null;
    } | null;
  } | null;
  created_at: string;
};

interface SessionDetailPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function SessionDetailPage({
  params,
}: SessionDetailPageProps) {
  const { id } = await params;
  const t = await getTranslations("session");
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  // Fetch session with all related data
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
        language
      )
    `
    )
    .eq("id", id)
    .single();

  if (sessionError || !session) {
    notFound();
  }

  const isOwner = session.user_id === user.id;

  if (!isOwner && !isAdmin) {
    notFound();
  }

  // Fetch feedback
  const { data: feedback } = await supabase
    .from("session_feedback")
    .select("*")
    .eq("session_id", id)
    .single();

  const { data: transcript } = await supabase
    .from("session_transcripts")
    .select("*")
    .eq("session_id", id)
    .single();

  const { data: webhookEvents } = (await supabase
    .from("webhook_events")
    .select("payload, created_at")
    .eq("provider", "elevenlabs")
    .order("created_at", { ascending: false })
    .limit(10)) as { data: StoredWebhookEvent[] | null };

  // Fetch notes
  const { data: notes } = await supabase
    .from("session_notes")
    .select("*")
    .eq("session_id", id)
    .single();

  // Transform agent
  const agent = Array.isArray(session.agents)
    ? session.agents[0]
    : session.agents;

  const backHref = isOwner ? "/sessions" : "/admin/sessions";

  const fallbackPayload = webhookEvents?.find((event) => {
    const sessionIdFromPayload = event.payload?.conversation_initiation_client_data?.dynamic_variables?.session_id;
    return sessionIdFromPayload === id && event.payload?.analysis;
  })?.payload;

  const analysisFromDb = feedback
    ? {
        scoreOverall: feedback.score_overall,
        scoreBreakdown: feedback.score_breakdown,
        rawFeedback: feedback.raw_feedback,
      }
    : null;

  const analysisFromWebhook = fallbackPayload?.analysis
    ? {
        scoreOverall: fallbackPayload.analysis.score_overall ?? null,
        scoreBreakdown: fallbackPayload.analysis.criteria ?? null,
        rawFeedback: {
          summary:
            fallbackPayload.analysis.transcript_summary ||
            fallbackPayload.analysis.call_summary_title ||
            undefined,
          tips: fallbackPayload.analysis.tips ?? [],
          criteria: fallbackPayload.analysis.criteria ?? undefined,
        },
      }
    : null;

  const transcriptFromDb: TranscriptMessage[] | null = Array.isArray(transcript?.transcript)
    ? (transcript!.transcript as { role: "user" | "agent"; message: string; timestamp?: string | null }[])
        .map((entry) => ({
          role: entry.role,
          message: entry.message,
          timestamp: entry.timestamp ?? undefined,
        }))
        .filter((entry) => entry.message)
    : null;

  const transcriptFromWebhook: TranscriptMessage[] | null = Array.isArray(fallbackPayload?.transcript)
    ? (fallbackPayload!.transcript ?? [])
        .map((entry) => ({
          role: (entry.role === "user" ? "user" : "agent") as "user" | "agent",
          message: entry.message || entry.original_message || "",
          timestamp: typeof entry.timestamp === "string" ? entry.timestamp : undefined,
        }))
        .filter((entry) => Boolean(entry.message))
    : null;

  const combinedFeedback = analysisFromDb ?? analysisFromWebhook;
  const combinedTranscript: TranscriptMessage[] | null =
    transcriptFromDb ?? transcriptFromWebhook ?? null;

  return (
    <div className="container mx-auto px-4 py-8">
      <SessionHeader
        session={{
          id: session.id,
          title: session.title_override || agent?.title || t("untitled"),
          status: session.status,
          startedAt: session.started_at,
          endedAt: session.ended_at,
          agent: {
            title: agent?.title || "",
            difficulty: agent?.difficulty || "",
            language: agent?.language || "",
          },
        }}
        canManage={isOwner}
        backHref={backHref}
      />

      <div className="mt-8 space-y-8">
        {/* Show pending message if no feedback yet */}
        {session.status === "pending" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-900/10">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500"></div>
              <p className="text-sm text-amber-800 dark:text-amber-400">
                {t("pending")}
              </p>
            </div>
          </div>
        )}

        {/* Feedback Section */}
        {combinedFeedback && (
          <SessionFeedback
            feedback={combinedFeedback}
          />
        )}

        {/* Transcript Section */}
        {combinedTranscript && combinedTranscript.length > 0 && (
          <SessionTranscript transcript={combinedTranscript} />
        )}

        {/* Notes Section */}
        <SessionNotes
          sessionId={session.id}
          initialNotes={notes?.notes_md || ""}
          readOnly={!isOwner}
        />
      </div>
    </div>
  );
}
