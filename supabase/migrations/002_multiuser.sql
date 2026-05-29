-- Migration 002: Multi-user support
-- Adds profiles table, user_id to surveys, RLS rewrite

-- =========================================
-- 1. Profiles table
-- =========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise', 'admin')),
  survey_limit INTEGER DEFAULT 5,
  response_limit INTEGER DEFAULT 100,
  ai_credits INTEGER DEFAULT 10,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin read all profiles" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Allow insert for trigger (service role)
CREATE POLICY "Service insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- =========================================
-- 2. Add user_id to surveys
-- =========================================
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON surveys(user_id);

-- =========================================
-- 3. Rewrite surveys RLS policies
-- =========================================
DROP POLICY IF EXISTS "Public can read published surveys" ON surveys;
DROP POLICY IF EXISTS "Service role full access surveys" ON surveys;

-- Published surveys are publicly readable (for respondents)
CREATE POLICY "Public read published" ON surveys
  FOR SELECT USING (status = 'published');

-- Users can fully manage their own surveys
CREATE POLICY "Users manage own surveys" ON surveys
  FOR ALL USING (auth.uid() = user_id);

-- Admin can access all surveys
CREATE POLICY "Admin full access surveys" ON surveys
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =========================================
-- 4. Rewrite responses RLS policies
-- =========================================
DROP POLICY IF EXISTS "Service role full access responses" ON responses;

-- Survey owners can read their responses
CREATE POLICY "Owners read responses" ON responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM surveys WHERE id = survey_id AND user_id = auth.uid())
  );

-- Admin can read all responses
CREATE POLICY "Admin read all responses" ON responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =========================================
-- 5. Auto-create profile on user signup
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- 6. Backfill existing surveys with current user
-- (Run manually: UPDATE surveys SET user_id = 'YOUR_USER_UUID' WHERE user_id IS NULL;)
-- =========================================
