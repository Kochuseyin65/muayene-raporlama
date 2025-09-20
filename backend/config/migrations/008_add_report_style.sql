ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS report_style JSONB DEFAULT '{}'::jsonb;
