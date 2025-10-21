import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List all agents (admin only)
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

  // Fetch all agents
  const { data: agents, error } = await supabase
    .from("agents")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ agents });
}

// POST - Create new agent (admin only)
export async function POST(request: Request) {
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

  const body = await request.json();

  const {
    title,
    shortDescription,
    difficulty,
    language,
    tags,
    thumbnailPath,
    elevenAgentId,
    isActive,
    displayOrder,
  } = body;

  // Insert new agent
  const { data: agent, error } = await supabase
    .from("agents")
    .insert({
      title,
      short_description: shortDescription,
      difficulty,
      language,
      tags: tags || [],
      thumbnail_path: thumbnailPath || null,
      eleven_agent_id: elevenAgentId,
      is_active: isActive ?? true,
      display_order: displayOrder ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ agent }, { status: 201 });
}
