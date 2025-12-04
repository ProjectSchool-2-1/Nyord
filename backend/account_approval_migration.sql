-- Migration to add account approval fields and remove rejection_reason
-- Run this SQL on your PostgreSQL database

-- Add new columns if they don't exist
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Remove rejection_reason column if it exists
ALTER TABLE accounts DROP COLUMN IF EXISTS rejection_reason;

-- Update existing accounts to have 'approved' status if they don't have a status
UPDATE accounts SET status = 'approved' WHERE status IS NULL OR status = '';

-- Add constraint to ensure status is valid
ALTER TABLE accounts ADD CONSTRAINT check_account_status 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_approved_by ON accounts(approved_by);