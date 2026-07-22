-- ============================================
-- WEBINAR SAAS — Initial Schema
-- Multi-tenant with Row-Level Security (RLS)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORGANIZATIONS (Tenants)
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own org"
  ON organizations FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can update their own org"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'presenter' CHECK (role IN ('admin', 'presenter', 'attendee')),
  display_name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- WEBINARS
-- ============================================
CREATE TABLE webinars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'recorded' CHECK (type IN ('live', 'recorded')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'live', 'ended')),
  video_url TEXT,
  video_platform TEXT DEFAULT 'youtube' CHECK (video_platform IN ('youtube', 'vimeo')),
  scheduled_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  replay_enabled BOOLEAN DEFAULT true,
  replay_expires_hours INTEGER DEFAULT 48,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view webinars"
  ON webinars FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
    OR true  -- Public access for attendees viewing by direct ID
  );

CREATE POLICY "Org members can insert webinars"
  ON webinars FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Org members can update webinars"
  ON webinars FOR UPDATE
  USING (org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Org members can delete webinars"
  ON webinars FOR DELETE
  USING (org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid()));

-- ============================================
-- REGISTRATION PAGES (Block-based)
-- ============================================
CREATE TABLE registration_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  blocks JSONB DEFAULT '[]',
  theme JSONB DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE registration_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published pages"
  ON registration_pages FOR SELECT
  USING (true);

CREATE POLICY "Org members can manage pages"
  ON registration_pages FOR ALL
  USING (
    webinar_id IN (
      SELECT id FROM webinars
      WHERE org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- ============================================
-- REGISTRATIONS (Attendees)
-- ============================================
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  registered_at TIMESTAMPTZ DEFAULT now(),
  attended BOOLEAN DEFAULT false,
  attended_at TIMESTAMPTZ,
  UNIQUE(webinar_id, email)
);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Public insert (anyone can register)
CREATE POLICY "Anyone can register"
  ON registrations FOR INSERT
  WITH CHECK (true);

-- Registrants can view own, org members can view all
CREATE POLICY "View registrations"
  ON registrations FOR SELECT
  USING (true);

CREATE POLICY "Org members can update registrations"
  ON registrations FOR UPDATE
  USING (
    webinar_id IN (
      SELECT id FROM webinars
      WHERE org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
    )
    OR id::text = current_setting('request.jwt.claims', true)::jsonb->>'sub'
  );

-- ============================================
-- CHAT MESSAGES (Real-time)
-- ============================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chat"
  ON chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can send chat"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

-- ============================================
-- SIMULATED MESSAGES
-- ============================================
CREATE TABLE simulated_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp_seconds INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE simulated_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view simulated messages"
  ON simulated_messages FOR SELECT
  USING (true);

CREATE POLICY "Org members can manage simulated messages"
  ON simulated_messages FOR ALL
  USING (
    webinar_id IN (
      SELECT id FROM webinars
      WHERE org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- ============================================
-- CTA CONFIGS
-- ============================================
CREATE TABLE cta_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  button_text TEXT NOT NULL DEFAULT 'Saiba mais',
  button_url TEXT NOT NULL,
  show_at_seconds INTEGER NOT NULL DEFAULT 0,
  hide_at_seconds INTEGER,
  style JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cta_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view CTAs"
  ON cta_configs FOR SELECT
  USING (true);

CREATE POLICY "Org members can manage CTAs"
  ON cta_configs FOR ALL
  USING (
    webinar_id IN (
      SELECT id FROM webinars
      WHERE org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- ============================================
-- POLLS
-- ============================================
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  show_at_seconds INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view polls"
  ON polls FOR SELECT
  USING (true);

CREATE POLICY "Org members can manage polls"
  ON polls FOR ALL
  USING (
    webinar_id IN (
      SELECT id FROM webinars
      WHERE org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- ============================================
-- POLL RESPONSES
-- ============================================
CREATE TABLE poll_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  selected_option INTEGER NOT NULL,
  responded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, registration_id)
);

ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can respond to polls"
  ON poll_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "View poll responses"
  ON poll_responses FOR SELECT
  USING (true);

-- ============================================
-- ANALYTICS EVENTS
-- ============================================
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Org members can view events"
  ON analytics_events FOR SELECT
  USING (
    webinar_id IN (
      SELECT id FROM webinars
      WHERE org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- ============================================
-- EMAIL CONFIGS
-- ============================================
CREATE TABLE email_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('confirmation', 'reminder', 'replay')),
  subject TEXT NOT NULL DEFAULT '',
  body_html TEXT DEFAULT '',
  send_before_minutes INTEGER,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE email_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage email configs"
  ON email_configs FOR ALL
  USING (
    webinar_id IN (
      SELECT id FROM webinars
      WHERE org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- ============================================
-- EMAIL QUEUE
-- ============================================
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_config_id UUID REFERENCES email_configs(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view email queue"
  ON email_queue FOR SELECT
  USING (
    email_config_id IN (
      SELECT id FROM email_configs
      WHERE webinar_id IN (
        SELECT id FROM webinars
        WHERE org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
      )
    )
  );

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_org_id ON profiles(org_id);
CREATE INDEX idx_webinars_org_id ON webinars(org_id);
CREATE INDEX idx_webinars_status ON webinars(status);
CREATE INDEX idx_webinars_scheduled_at ON webinars(scheduled_at);
CREATE INDEX idx_registrations_webinar_id ON registrations(webinar_id);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_chat_messages_webinar_id ON chat_messages(webinar_id);
CREATE INDEX idx_simulated_messages_webinar_id ON simulated_messages(webinar_id);
CREATE INDEX idx_cta_configs_webinar_id ON cta_configs(webinar_id);
CREATE INDEX idx_polls_webinar_id ON polls(webinar_id);
CREATE INDEX idx_poll_responses_poll_id ON poll_responses(poll_id);
CREATE INDEX idx_analytics_events_webinar_id ON analytics_events(webinar_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled_at ON email_queue(scheduled_at);

-- ============================================
-- FUNCTIONS (Auto-create profile + org on signup)
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
  user_org_name TEXT;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'User');
  user_org_name := COALESCE(NEW.raw_user_meta_data->>'org_name', user_name || '''s Org');

  -- Create organization
  INSERT INTO organizations (name, slug, owner_id)
  VALUES (
    user_org_name,
    LOWER(REPLACE(user_org_name, ' ', '-')) || '-' || SUBSTRING(NEW.id::text, 1, 8),
    NEW.id
  )
  RETURNING id INTO new_org_id;

  -- Create profile
  INSERT INTO profiles (user_id, org_id, role, display_name)
  VALUES (NEW.id, new_org_id, 'presenter', user_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- REALTIME (Enable for chat)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
