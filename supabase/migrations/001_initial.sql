-- Surveys table
CREATE TABLE surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '未命名问卷',
  description TEXT DEFAULT '',
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  share_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Responses table
CREATE TABLE responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Files table
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_responses_survey_id ON responses(survey_id);
CREATE INDEX idx_surveys_share_id ON surveys(share_id);
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_files_response_id ON files(response_id);

-- Row Level Security
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can read published surveys
CREATE POLICY "Public can read published surveys" ON surveys
  FOR SELECT USING (status = 'published');

-- Policies: Anyone can insert responses to published surveys
CREATE POLICY "Public can submit responses" ON responses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM surveys WHERE id = survey_id AND status = 'published')
  );

-- Policies: Anyone can upload files
CREATE POLICY "Public can upload files" ON files
  FOR INSERT WITH CHECK (true);

-- Service role can do everything (used by admin API routes)
CREATE POLICY "Service role full access surveys" ON surveys
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access responses" ON responses
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access files" ON files
  FOR ALL USING (auth.role() = 'service_role');
