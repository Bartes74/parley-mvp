import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

  // Get query parameters for filtering
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const agentId = searchParams.get("agentId");
  const status = searchParams.get("status");

  // Build query
  let query = supabase
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
    .order("created_at", { ascending: false });

  // Apply filters
  if (userId) {
    query = query.eq("user_id", userId);
  }
  if (agentId) {
    query = query.eq("agent_id", agentId);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data: sessions, error } = await query;

  if (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }

  return NextResponse.json({ sessions });
}
