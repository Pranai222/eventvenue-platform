-- Run this SQL in your database to fix credit request storage

-- 1. First, check if table exists and create if not
CREATE TABLE IF NOT EXISTS credit_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    points_requested INT NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    admin_id BIGINT,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Check if there are any records
SELECT COUNT(*) as total_requests FROM credit_requests;

-- 3. If you need to test, insert a sample record
-- INSERT INTO credit_requests (user_id, points_requested, reason, status, created_at, updated_at)
-- VALUES (1, 500, 'Test request', 'PENDING', NOW(), NOW());

-- 4. After inserting test data, verify with:
-- SELECT * FROM credit_requests;
