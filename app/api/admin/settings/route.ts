import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get all settings (admin only)
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

  // Fetch all settings
  const { data: settings, error } = await supabase
    .from("settings")
    .select("key, value");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform array of {key, value} into a single object
  const settingsObject = settings.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {} as Record<string, unknown>);

  return NextResponse.json({ settings: settingsObject });
}

// PATCH - Update specific setting (admin only)
export async function PATCH(request: Request) {
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
  const { key, value } = body;

  if (!key) {
    return NextResponse.json({ error: "Key is required" }, { status: 400 });
  }

  // Update or insert setting
  const { data, error } = await supabase
    .from("settings")
    .upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ setting: data });
}
