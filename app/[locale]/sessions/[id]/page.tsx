import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { SessionHeader } from "@/components/session-detail/session-header";
import { SessionFeedback } from "@/components/session-detail/session-feedback";
import { SessionTranscript } from "@/components/session-detail/session-transcript";
import { SessionNotes } from "@/components/session-detail/session-notes";

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

  // Verify user owns this session
  if (session.user_id !== user.id) {
    notFound();
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

  // Transform agent
  const agent = Array.isArray(session.agents)
    ? session.agents[0]
    : session.agents;

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
        {feedback && (
          <SessionFeedback
            feedback={{
              scoreOverall: feedback.score_overall,
              scoreBreakdown: feedback.score_breakdown,
              rawFeedback: feedback.raw_feedback,
            }}
          />
        )}

        {/* Transcript Section */}
        {transcript && (
          <SessionTranscript transcript={transcript.transcript} />
        )}

        {/* Notes Section */}
        <SessionNotes sessionId={session.id} initialNotes={notes?.notes_md || ""} />
      </div>
    </div>
  );
}
