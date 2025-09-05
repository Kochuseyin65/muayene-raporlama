-- Drop legacy base64 columns now that file-based storage is used
ALTER TABLE reports DROP COLUMN IF EXISTS unsigned_pdf_base64;
ALTER TABLE reports DROP COLUMN IF EXISTS signed_pdf_base64;

