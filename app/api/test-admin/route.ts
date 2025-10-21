import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      error: "Not authenticated",
      authError: authError?.message,
    });
  }

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get all profiles with this email
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", "bartek@dajer.pl");

  return NextResponse.json({
    authenticated: true,
    authUser: {
      id: user.id,
      email: user.email,
    },
    profile,
    profileError: profileError?.message,
    allProfilesWithEmail: allProfiles,
  });
}
