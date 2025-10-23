ALTER TABLE agents
ADD COLUMN IF NOT EXISTS eleven_webhook_secret TEXT;
