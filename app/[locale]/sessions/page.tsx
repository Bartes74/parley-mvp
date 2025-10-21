import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { SessionsList } from "@/components/sessions-list";

export default async function SessionsPage() {
  const t = await getTranslations("sessions");
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's sessions with agent details
  const { data: rawSessions } = await supabase
    .from("sessions")
    .select(
      `
      id,
      status,
      started_at,
      ended_at,
      title_override,
      created_at,
      agents!inner (
        id,
        title,
        difficulty,
        language
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Transform to match component interface (agents is array from join, take first)
  const sessions = rawSessions?.map((session) => ({
    ...session,
    agents: Array.isArray(session.agents) ? session.agents[0] : session.agents,
  })) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Sessions List */}
      <SessionsList sessions={sessions} />
    </div>
  );
}
