import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { AgentForm } from "@/components/admin/agent-form";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("admin.agents");
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

  // Fetch agent
  const { data: agent, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !agent) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("editAgent")}</h2>
        <p className="text-muted-foreground mt-2">
          {t("editAgentDescription")}
        </p>
      </div>

      <AgentForm
        agent={{
          id: agent.id,
          title: agent.title,
          shortDescription: agent.short_description,
          instructions: agent.instructions || "",
          difficulty: agent.difficulty,
          language: agent.language,
          tags: agent.tags || [],
          thumbnailPath: agent.thumbnail_path || "",
          elevenAgentId: agent.eleven_agent_id,
          elevenWebhookSecret: agent.eleven_webhook_secret || "",
          isActive: agent.is_active,
          displayOrder: agent.display_order || 0,
        }}
      />
    </div>
  );
}
