-- Add customer decision fields to offers
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS customer_decision VARCHAR(20),
  ADD COLUMN IF NOT EXISTS customer_decision_note TEXT,
  ADD COLUMN IF NOT EXISTS customer_decision_at TIMESTAMP;

