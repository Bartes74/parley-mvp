-- Insert default settings into existing key-value settings table
-- Settings table structure: key TEXT PRIMARY KEY, value JSONB

-- Branding settings
INSERT INTO settings (key, value) VALUES
  ('branding', '{"logo_path": null, "primary_color": "#10b981"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Landing page settings
INSERT INTO settings (key, value) VALUES
  ('landing', '{"headline": "Parley", "lead": "Platforma do treningu rozmów z AI", "cta_login": "Zaloguj się", "cta_register": "Utwórz konto"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Email notification settings
INSERT INTO settings (key, value) VALUES
  ('email', '{"enabled": false, "sender_name": "Parley"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
