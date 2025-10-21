import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DEVELOPMENT ONLY - Make current user admin
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Update user to admin
  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    profile,
    message: "User is now admin. Please refresh the page.",
  });
}
