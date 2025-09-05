-- Queue table for asynchronous report PDF generation
CREATE TABLE IF NOT EXISTS report_jobs (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | processing | completed | failed
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  priority INTEGER NOT NULL DEFAULT 100,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Speed lookups
CREATE INDEX IF NOT EXISTS idx_report_jobs_status ON report_jobs(status);
CREATE INDEX IF NOT EXISTS idx_report_jobs_created_at ON report_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_report_jobs_report_id ON report_jobs(report_id);

-- Ensure single active job per report
CREATE UNIQUE INDEX IF NOT EXISTS uniq_report_jobs_active ON report_jobs(report_id)
  WHERE status IN ('pending','processing');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_report_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_report_jobs_updated_at BEFORE UPDATE ON report_jobs
FOR EACH ROW EXECUTE FUNCTION update_report_jobs_updated_at();

