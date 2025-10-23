import crypto from "crypto";
import fetch from "node-fetch";

type DynamicVariables = {
  user_id?: string;
  session_id?: string;
  agent_db_id?: string;
};

type Payload = {
  test: string;
  conversation_initiation_client_data: {
    dynamic_variables: DynamicVariables;
  };
};

async function main() {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  const endpoint = process.env.ELEVENLABS_WEBHOOK_URL;

  if (!secret) {
    console.error("Missing ELEVENLABS_WEBHOOK_SECRET env variable");
    process.exit(1);
  }

  if (!endpoint) {
    console.error("Missing ELEVENLABS_WEBHOOK_URL env variable");
    process.exit(1);
  }

  const payload: Payload = {
    test: "manual-call",
    conversation_initiation_client_data: {
      dynamic_variables: {
        session_id: "test-session",
      },
    },
  };

  const body = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

  console.log("Sending test payload to", endpoint);
  console.log("Payload:", body);
  console.log("Signature:", signature);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": signature,
      },
      body,
    });

    const text = await response.text();

    console.log("Status:", response.status);
    console.log("Response:", text);
  } catch (error) {
    console.error("Request failed:", error);
    process.exit(1);
  }
}

main();
