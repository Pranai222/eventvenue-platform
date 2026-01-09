-- ============================================
-- SCHEMA VERIFICATION AND DATA UPDATE SCRIPT
-- Run this script to ensure database is up-to-date
-- ============================================

USE eventvenue_db;

-- ============================================
-- 1. ADD/VERIFY USER_NAME COLUMN IN BOOKINGS
-- ============================================
-- Check if user_name column exists, add if not
SET @dbname = 'eventvenue_db';
SET @tablename = 'bookings';
SET @columnname = 'user_name';

-- MySQL conditional column add
SELECT COUNT(*) INTO @exists
FROM information_schema.columns 
WHERE table_schema = @dbname
AND table_name = @tablename 
AND column_name = @columnname;

SET @query = IF(@exists = 0, 
    'ALTER TABLE bookings ADD COLUMN user_name VARCHAR(255) AFTER user_id',
    'SELECT "Column user_name already exists" as message');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. POPULATE USER NAMES IN EXISTING BOOKINGS
-- ============================================
UPDATE bookings b 
SET user_name = (
    SELECT 
        CASE 
            WHEN u.first_name IS NOT NULL AND u.first_name != '' THEN 
                CONCAT(u.first_name, COALESCE(CONCAT(' ', u.last_name), ''))
            ELSE 
                COALESCE(u.username, CONCAT('User #', u.id))
        END
    FROM users u 
    WHERE u.id = b.user_id
)
WHERE b.user_name IS NULL OR b.user_name = '';

-- ============================================
-- 3. VERIFY ALL TABLES EXIST
-- ============================================
SELECT 'Verifying required tables...' as status;

-- Check for all required tables
SELECT 
    TABLE_NAME,
    CASE WHEN TABLE_NAME IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'eventvenue_db'
AND TABLE_NAME IN (
    'users', 'vendors', 'venues', 'events', 'bookings', 
    'reviews', 'points_history', 'otp_verifications', 
    'system_settings', 'admin_users', 'audit_logs',
    'seat_categories', 'event_seats', 'products',
    'credit_transactions', 'credit_requests', 'withdrawal_requests'
);

-- ============================================
-- 4. VERIFY BOOKINGS TABLE STRUCTURE
-- ============================================
SELECT 'Checking bookings table columns...' as status;

SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'eventvenue_db' 
AND TABLE_NAME = 'bookings'
ORDER BY ORDINAL_POSITION;

-- ============================================
-- 5. SHOW UPDATED BOOKINGS SAMPLE
-- ============================================
SELECT 'Sample of updated bookings with user names:' as status;

SELECT id, user_id, user_name, venue_id, event_id, status, total_amount, created_at
FROM bookings 
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================
-- 6. SUMMARY COUNTS
-- ============================================
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM vendors) as total_vendors,
    (SELECT COUNT(*) FROM venues) as total_venues,
    (SELECT COUNT(*) FROM events) as total_events,
    (SELECT COUNT(*) FROM bookings) as total_bookings,
    (SELECT COUNT(*) FROM bookings WHERE user_name IS NOT NULL AND user_name != '') as bookings_with_names,
    (SELECT COUNT(*) FROM reviews) as total_reviews;

SELECT 'Database schema verification complete!' as status;
