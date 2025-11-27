-- Migration to add account_type column to accounts table
-- Run this SQL in your PostgreSQL database

-- Add account_type column with default value
ALTER TABLE accounts 
ADD COLUMN account_type VARCHAR(20) DEFAULT 'savings';

-- Update existing accounts to have 'savings' type if NULL
UPDATE accounts 
SET account_type = 'savings' 
WHERE account_type IS NULL;

-- Optional: Add a check constraint to ensure only valid account types
ALTER TABLE accounts 
ADD CONSTRAINT check_account_type 
CHECK (account_type IN ('savings', 'current'));

-- Verify the changes
SELECT id, account_number, account_type, balance, user_id FROM accounts LIMIT 10;
