import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DEVELOPMENT ONLY - Create test admin user
export async function POST() {
  const supabase = await createClient();

  const email = "admin@parley.test";
  const password = "Admin123!";

  try {
    // Try to create user via auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (signUpError) {
      // User might already exist, try to get their ID
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        return NextResponse.json({
          error: "Could not create or find user",
          details: signUpError.message
        }, { status: 500 });
      }

      const existingUser = users?.find(u => u.email === email);

      if (existingUser) {
        // Update profile to admin
        const { error: updateError } = await supabase
          .from('profiles')
          .upsert({
            id: existingUser.id,
            email: existingUser.email,
            role: 'admin',
          }, { onConflict: 'id' });

        if (updateError) {
          return NextResponse.json({
            error: "Could not update profile",
            details: updateError.message
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: "User already exists, updated to admin",
          credentials: {
            email,
            password,
          },
          userId: existingUser.id
        });
      }
    }

    // New user created
    if (authData.user) {
      // Update profile to admin
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: authData.user.email,
          role: 'admin',
        }, { onConflict: 'id' });

      if (profileError) {
        return NextResponse.json({
          error: "User created but could not update profile",
          details: profileError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Test admin user created successfully",
        credentials: {
          email,
          password,
        },
        userId: authData.user.id
      });
    }

    return NextResponse.json({
      error: "Unknown error creating user"
    }, { status: 500 });

  } catch (error) {
    return NextResponse.json({
      error: "Exception occurred",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
