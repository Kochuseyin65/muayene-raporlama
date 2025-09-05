-- Store PDF files on disk; keep paths in DB
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS unsigned_pdf_path TEXT,
  ADD COLUMN IF NOT EXISTS signed_pdf_path TEXT;

