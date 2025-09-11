-- Add unique inspection_number to inspections
ALTER TABLE inspections
  ADD COLUMN IF NOT EXISTS inspection_number VARCHAR(50);

-- Backfill existing rows with deterministic values based on id
UPDATE inspections
SET inspection_number = 'INSP-' || lpad(id::text, 9, '0')
WHERE inspection_number IS NULL;

-- Add unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inspections_inspection_number_key'
  ) THEN
    ALTER TABLE inspections
      ADD CONSTRAINT inspections_inspection_number_key UNIQUE (inspection_number);
  END IF;
END $$;

