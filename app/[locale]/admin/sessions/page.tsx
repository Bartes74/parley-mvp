import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SessionsList } from "@/components/admin/sessions-list";

export default async function AdminSessionsPage() {
  const t = await getTranslations("admin.sessions");
  const supabase = await createClient();

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

  if (profile?.role !== "admin") {
    redirect("/agents");
  }

  // Fetch initial sessions (all, without filters)
  const { data: sessions } = await supabase
    .from("sessions")
    .select(
      `
      id,
      user_id,
      agent_id,
      status,
      started_at,
      ended_at,
      title_override,
      created_at,
      profiles!inner (
        id,
        email
      ),
      agents!inner (
        id,
        title,
        difficulty,
        language
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch all agents for filter dropdown
  const { data: agents } = await supabase
    .from("agents")
    .select("id, title")
    .eq("is_active", true)
    .order("title");

  // Fetch all users for filter dropdown
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email")
    .order("email");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground mt-2">{t("description")}</p>
      </div>

      <SessionsList
        initialSessions={sessions || []}
        agents={agents || []}
        users={users || []}
      />
    </div>
  );
}
