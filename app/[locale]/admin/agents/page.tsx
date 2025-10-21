import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AgentsList } from "@/components/admin/agents-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function AdminAgentsPage() {
  const t = await getTranslations("admin.agents");
  const supabase = await createClient();

  // Check authentication and admin role
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

  // Fetch all agents
  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
        <Link href="/admin/agents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("add")}
          </Button>
        </Link>
      </div>

      <AgentsList agents={agents || []} />
    </div>
  );
}
