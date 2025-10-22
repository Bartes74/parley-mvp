-- Add instructions field to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Add comment
COMMENT ON COLUMN agents.instructions IS 'Custom instructions displayed on agent detail page before starting conversation';
