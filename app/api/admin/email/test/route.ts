import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface EmailSettingsValue {
  enabled?: boolean;
  sender_name?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { to?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const to = body?.to?.trim();

  if (!to) {
    return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return NextResponse.json(
      { error: "Email provider is not configured (missing RESEND_API_KEY or RESEND_FROM_EMAIL)" },
      { status: 500 }
    );
  }

  const { data: emailSettingsRow } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "email")
    .single();

  const emailSettings = (emailSettingsRow?.value as EmailSettingsValue) ?? {};

  if (emailSettings.enabled === false) {
    return NextResponse.json(
      { error: "Email notifications are disabled" },
      { status: 400 }
    );
  }

  const senderName = emailSettings.sender_name?.trim() || "Parley";
  const from = `${senderName} <${fromEmail}>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Parley – test powiadomienia e-mail",
        html: `
          <p>Cześć!</p>
          <p>To jest testowy e-mail wysłany z panelu administracyjnego Parley.</p>
          <p>Jeśli widzisz tę wiadomość, konfiguracja powiadomień działa poprawnie.</p>
          <p style="margin-top: 24px;">Pozdrawiamy,<br/>Zespół Parley</p>
        `,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("[Email] Resend response error:", response.status, errorBody);
      return NextResponse.json(
        { error: "Failed to send email", details: errorBody },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unexpected error sending email" },
      { status: 500 }
    );
  }
}
