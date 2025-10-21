-- Enable UUID extension FIRST
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CLEAN UP: Drop all existing tables (in correct order due to foreign keys)
-- ============================================================
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS session_notes CASCADE;
DROP TABLE IF EXISTS session_transcripts CASCADE;
DROP TABLE IF EXISTS session_feedback CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
-- Keep profiles as it might be used by auth system

-- Drop existing triggers and functions (wrapped in DO block to avoid errors)
DO $$
BEGIN
  -- Drop triggers if tables exist
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agents') THEN
    DROP TRIGGER IF EXISTS agents_updated_at ON agents;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'session_notes') THEN
    DROP TRIGGER IF EXISTS session_notes_updated_at ON session_notes;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'settings') THEN
    DROP TRIGGER IF EXISTS settings_updated_at ON settings;
  END IF;
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================================
-- PROFILES (extends auth.users) - Only create if doesn't exist
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      display_name TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_profiles_role ON profiles(role);
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recreate policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Create function for updating updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- AGENTS
-- ============================================================
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  short_description TEXT,
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  language TEXT NOT NULL DEFAULT 'pl' CHECK (language IN ('pl', 'en')),
  tags TEXT[] DEFAULT '{}',
  thumbnail_path TEXT,
  eleven_agent_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_is_active ON agents(is_active);
CREATE INDEX idx_agents_display_order ON agents(display_order);
CREATE INDEX idx_agents_language ON agents(language);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active agents"
  ON agents FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Only admins can insert agents"
  ON agents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update agents"
  ON agents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete agents"
  ON agents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SESSIONS
-- ============================================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'error')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  title_override TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_agent_id ON sessions(agent_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- SESSION_FEEDBACK
-- ============================================================
CREATE TABLE session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  raw_feedback JSONB,
  score_overall NUMERIC,
  score_breakdown JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_feedback_session_id ON session_feedback(session_id);

ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session feedback"
  ON session_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_feedback.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all session feedback"
  ON session_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert session feedback"
  ON session_feedback FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- SESSION_TRANSCRIPTS
-- ============================================================
CREATE TABLE session_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  transcript JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_transcripts_session_id ON session_transcripts(session_id);

ALTER TABLE session_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session transcripts"
  ON session_transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_transcripts.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all session transcripts"
  ON session_transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert session transcripts"
  ON session_transcripts FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- SESSION_NOTES
-- ============================================================
CREATE TABLE session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  notes_md TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_notes_session_id ON session_notes(session_id);

ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session notes"
  ON session_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_notes.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session notes"
  ON session_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_notes.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own session notes"
  ON session_notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_notes.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all session notes"
  ON session_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER session_notes_updated_at
  BEFORE UPDATE ON session_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view settings"
  ON settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert settings"
  ON settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update settings"
  ON settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

INSERT INTO settings (key, value) VALUES
  ('retention_days_transcripts', '0'),
  ('retention_days_feedback', '0'),
  ('emails_enabled', 'true'),
  ('emails_sender_name', '"Parley"'),
  ('branding', '{"logo_path": null, "palette": "graphite-emerald"}'),
  ('landing', '{"title": "Trenuj rozmowy, które liczą się naprawdę", "lead": "Ćwicz z agentami AI i otrzymuj szczegółowy feedback.", "cta_text": "Zaloguj się"}');

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- WEBHOOK_EVENTS
-- ============================================================
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'elevenlabs',
  event_type TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at DESC);
CREATE INDEX idx_webhook_events_provider ON webhook_events(provider);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view webhook events"
  ON webhook_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert webhook events"
  ON webhook_events FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- FUNCTIONS & TRIGGERS for auth
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-thumbnails', 'agent-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public read access for agent thumbnails" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can upload agent thumbnails" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can update agent thumbnails" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can delete agent thumbnails" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Public read access for agent thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agent-thumbnails');

CREATE POLICY "Admins can upload agent thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'agent-thumbnails' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update agent thumbnails"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'agent-thumbnails' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete agent thumbnails"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'agent-thumbnails' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
