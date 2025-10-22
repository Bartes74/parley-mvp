import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // Check authentication and admin role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Insert test agent
  const { data: agent, error } = await supabase
    .from("agents")
    .upsert(
      {
        title: "Test Agent",
        short_description: "Agent testowy do treningu rozmów",
        difficulty: "beginner",
        language: "pl",
        tags: ["test", "trening"],
        eleven_agent_id: "J18U9zBeyGlbXKp4koaA",
        is_active: true,
        display_order: 1,
      },
      {
        onConflict: "eleven_agent_id",
      }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    agent,
    message: "Test agent added successfully! Go to /agents to see it."
  });
}
