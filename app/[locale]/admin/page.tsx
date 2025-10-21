import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Bot, MessageSquare, Activity } from "lucide-react";

export default async function AdminDashboard() {
  const t = await getTranslations("admin.dashboard");
  const supabase = await createClient();

  // Fetch statistics
  const [
    { count: totalUsers },
    { count: totalAgents },
    { count: totalSessions },
    { count: activeSessions },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("agents").select("*", { count: "exact", head: true }),
    supabase.from("sessions").select("*", { count: "exact", head: true }),
    supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const stats = [
    {
      title: t("totalUsers"),
      value: totalUsers ?? 0,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: t("totalAgents"),
      value: totalAgents ?? 0,
      icon: Bot,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: t("totalSessions"),
      value: totalSessions ?? 0,
      icon: MessageSquare,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: t("activeSessions"),
      value: activeSessions ?? 0,
      icon: Activity,
      color: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
