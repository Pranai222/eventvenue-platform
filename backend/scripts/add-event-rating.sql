-- Migration script to add rating and review_count columns to events table
-- Run this script on existing databases to add the new columns

-- Add rating column
ALTER TABLE events ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0.00;

-- Add review_count column
ALTER TABLE events ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

-- Add index for faster rating queries
CREATE INDEX IF NOT EXISTS idx_rating ON events(rating);

-- Update existing events with calculated ratings from reviews
UPDATE events e
SET 
    rating = COALESCE((
        SELECT AVG(r.rating) 
        FROM reviews r 
        WHERE r.event_id = e.id
    ), 0.00),
    review_count = COALESCE((
        SELECT COUNT(*) 
        FROM reviews r 
        WHERE r.event_id = e.id
    ), 0);
