-- Fix withdrawal_requests foreign key constraint
-- The existing table has a foreign key that references users table,
-- but vendors have IDs from vendors table, not users table.
-- This script removes the constraint so both users and vendors can submit withdrawals.

-- Drop the foreign key constraint
ALTER TABLE withdrawal_requests DROP FOREIGN KEY withdrawal_requests_ibfk_1;

-- Also fix credit_requests if it has the same issue  
ALTER TABLE credit_requests DROP FOREIGN KEY credit_requests_ibfk_1;

-- If the above commands fail because constraint doesn't exist, that's OK
-- You can also recreate the tables without foreign keys:
-- DROP TABLE IF EXISTS withdrawal_requests;
-- DROP TABLE IF EXISTS credit_requests;
-- Then run the schema.sql to recreate them without foreign keys
