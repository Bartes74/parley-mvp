import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UsersList } from "@/components/admin/users-list";

export default async function AdminUsersPage() {
  const t = await getTranslations("admin.users");
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

  // Fetch all users
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });

  // Get session counts
  const usersWithCounts = await Promise.all(
    (users || []).map(async (userProfile) => {
      const { count } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userProfile.id);

      return {
        ...userProfile,
        sessionCount: count || 0,
      };
    })
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
      <UsersList users={usersWithCounts} currentUserId={user.id} />
    </div>
  );
}
