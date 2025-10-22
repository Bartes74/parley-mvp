-- Allow anonymous users to READ settings (needed for landing page)
-- But only admins can INSERT/UPDATE/DELETE

DROP POLICY IF EXISTS "Only admins can view settings" ON settings;

-- New policy: Anyone can read settings (for landing page)
CREATE POLICY "Anyone can view settings"
  ON settings FOR SELECT
  USING (true);

-- Keep admin-only policies for modifications
-- (already exist: "Only admins can insert settings", "Only admins can update settings")
