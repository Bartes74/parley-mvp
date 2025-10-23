/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require("crypto");

  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  const endpoint = process.env.ELEVENLABS_WEBHOOK_URL;

  if (!secret) {
    console.error("Brakuje zmiennej środowiskowej ELEVENLABS_WEBHOOK_SECRET");
    process.exit(1);
  }

  if (!endpoint) {
    console.error("Brakuje zmiennej środowiskowej ELEVENLABS_WEBHOOK_URL");
    process.exit(1);
  }

  const payload = {
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

  (async () => {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-signature": signature,
        },
        body,
      });

      console.log("Status:", res.status);
      console.log("Response:", await res.text());
    } catch (err) {
      console.error("Request failed:", err);
      process.exit(1);
    }
  })();
