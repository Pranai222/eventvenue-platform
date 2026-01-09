-- Create Database
CREATE DATABASE IF NOT EXISTS eventvenue_db;
USE eventvenue_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    points BIGINT DEFAULT 200,
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_email (email),
    KEY idx_username (username),
    KEY idx_role (role)
);

-- Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    business_description TEXT,
    business_phone VARCHAR(20),
    business_address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_venues INT DEFAULT 0,
    points BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_email (email),
    KEY idx_username (username),
    KEY idx_status (status),
    KEY idx_is_verified (is_verified)
);

-- Venues Table
CREATE TABLE IF NOT EXISTS venues (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vendor_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    address VARCHAR(500) NOT NULL,
    capacity INT NOT NULL,
    price_per_hour DECIMAL(10, 2) NOT NULL,
    amenities TEXT,
    images TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_bookings INT DEFAULT 0,
    vendor_phone VARCHAR(20) NOT NULL,
    edit_count INT DEFAULT 0,
    is_edit_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    KEY idx_vendor_id (vendor_id),
    KEY idx_city (city),
    KEY idx_is_available (is_available)
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vendor_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    event_date DATETIME NOT NULL,
    event_time TIME,
    location VARCHAR(255) NOT NULL,
    max_attendees INT,
    price_per_ticket DECIMAL(10, 2) NOT NULL,
    total_tickets INT NOT NULL,
    tickets_available INT NOT NULL,
    booking_type VARCHAR(20) DEFAULT 'QUANTITY',  -- QUANTITY or SEAT_SELECTION
    is_active BOOLEAN DEFAULT TRUE,
    images TEXT,
    -- Reschedule tracking fields
    reschedule_count INT DEFAULT 0,
    was_rescheduled BOOLEAN DEFAULT FALSE,
    last_rescheduled_at TIMESTAMP,
    reschedule_reason TEXT,
    original_event_date DATETIME,
    original_location VARCHAR(255),
    -- Rating fields (calculated from reviews)
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    -- Cancellation tracking fields
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP,
    -- Vendor contact phone (mandatory)
    vendor_phone VARCHAR(20) NOT NULL,
    -- Edit limit tracking
    edit_count INT DEFAULT 0,
    is_edit_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    KEY idx_vendor_id (vendor_id),
    KEY idx_event_date (event_date),
    KEY idx_is_active (is_active),
    KEY idx_is_cancelled (is_cancelled),
    KEY idx_was_rescheduled (was_rescheduled),
    KEY idx_rating (rating)
);


-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    user_name VARCHAR(255),
    venue_id BIGINT,
    event_id BIGINT,
    booking_date DATE NOT NULL,
    start_date DATE,
    end_date DATE,
    check_in_time TIME,
    check_out_time TIME,
    duration_hours INT,
    quantity INT DEFAULT 1,
    seat_ids TEXT,                              -- JSON array of seat IDs: "[1, 2, 3]"
    total_amount DECIMAL(10, 2) NOT NULL,
    points_used INT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    refund_amount DECIMAL(10, 2),
    refund_percentage INT,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    KEY idx_user_id (user_id),
    KEY idx_venue_id (venue_id),
    KEY idx_event_id (event_id),
    KEY idx_status (status),
    KEY idx_payment_status (payment_status)
);

-- Seat Categories Table (for seat-based event booking)
CREATE TABLE IF NOT EXISTS seat_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,               -- "VIP", "First Class", "General"
    price DECIMAL(10, 2) NOT NULL,
    color VARCHAR(20) DEFAULT '#22c55e',      -- For UI display
    row_labels TEXT NOT NULL,                  -- JSON array: ["A", "B", "C"]
    seats_per_row INT NOT NULL,               -- 14 seats per row
    aisle_after TEXT,                         -- "3,10" - gaps after seat 3 and 10
    sort_order INT DEFAULT 0,                 -- Display order (0 = top/closest to stage)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    KEY idx_event_id (event_id)
);

-- Event Seats Table (individual seats for seat-selection events)
CREATE TABLE IF NOT EXISTS event_seats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    row_label VARCHAR(5) NOT NULL,            -- "A", "B", "C"
    seat_number INT NOT NULL,                 -- 1, 2, 3...
    status VARCHAR(20) DEFAULT 'AVAILABLE',   -- AVAILABLE, BOOKED, BLOCKED
    price DECIMAL(10, 2) NOT NULL,
    booking_id BIGINT,                        -- Links to booking when booked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES seat_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    UNIQUE KEY uk_seat (event_id, row_label, seat_number),
    KEY idx_event_id (event_id),
    KEY idx_category_id (category_id),
    KEY idx_status (status)
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vendor_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DOUBLE NOT NULL,
    quantity INT DEFAULT 0,
    image_url VARCHAR(500),
    rating DOUBLE DEFAULT 0.0,
    review_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    KEY idx_vendor_id (vendor_id),
    KEY idx_category (category)
);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ADMIN',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_email (email)
);

-- Points History Table
CREATE TABLE IF NOT EXISTS points_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    points_changed BIGINT NOT NULL,
    reason VARCHAR(255),
    previous_points BIGINT,
    new_points BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_id (user_id)
);

-- OTP Verification Table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_used BOOLEAN DEFAULT FALSE,
    KEY idx_otp_email_role (email, role, is_used)
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value VARCHAR(500),
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_setting_key (setting_key)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    venue_id BIGINT,
    event_id BIGINT,
    rating INT NOT NULL,
    comment TEXT,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    KEY idx_user_id (user_id),
    KEY idx_venue_id (venue_id),
    KEY idx_event_id (event_id)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    description VARCHAR(1000),
    performed_by VARCHAR(255),
    user_role VARCHAR(50),
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_action (action),
    KEY idx_entity_type (entity_type),
    KEY idx_performed_by (performed_by),
    KEY idx_created_at (created_at)
);

-- ============================================
-- STRIPE PAYMENT GATEWAY TABLES
-- ============================================

-- Credit Transactions Table (tracks all payment transactions)
CREATE TABLE IF NOT EXISTS credit_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,  -- 'PURCHASE', 'REQUEST', 'WITHDRAWAL'
    amount_usd DECIMAL(10, 2),               -- Amount in USD
    points_amount INT NOT NULL,              -- Points involved
    stripe_payment_intent_id VARCHAR(255),   -- Stripe payment intent ID
    stripe_payout_id VARCHAR(255),           -- Stripe payout ID (for withdrawals)
    status VARCHAR(50) NOT NULL,             -- 'PENDING', 'COMPLETED', 'FAILED', 'APPROVED', 'REJECTED'
    reason TEXT,                             -- Reason for request (if REQUEST type)
    admin_notes TEXT,                        -- Admin notes for approvals/rejections
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_id (user_id),
    KEY idx_transaction_type (transaction_type),
    KEY idx_status (status),
    KEY idx_created_at (created_at)
);

-- Credit Requests Table (user requests for free credits from admin)
CREATE TABLE IF NOT EXISTS credit_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    points_requested INT NOT NULL,
    reason TEXT NOT NULL,                    -- User's reason for requesting credits
    status VARCHAR(50) DEFAULT 'PENDING',    -- 'PENDING', 'APPROVED', 'REJECTED'
    admin_id BIGINT,                         -- Admin who approved/rejected
    admin_notes TEXT,                        -- Admin's notes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL,
    KEY idx_user_id (user_id),
    KEY idx_status (status),
    KEY idx_created_at (created_at)
);

-- Withdrawal Requests Table (vendors convert points to money)
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,                 -- Can be user or vendor
    points_amount INT NOT NULL,
    amount_usd DECIMAL(10, 2) NOT NULL,     -- Calculated amount based on conversion ratio
    status VARCHAR(50) DEFAULT 'PENDING',    -- 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'
    stripe_payout_id VARCHAR(255),           -- Stripe payout ID when processed
    admin_id BIGINT,                         -- Admin who approved (if >$1000)
    admin_notes TEXT,
    requires_approval BOOLEAN DEFAULT FALSE, -- TRUE if amount > $1000
    card_last4 VARCHAR(4),                   -- Last 4 digits of card for payout
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL,
    KEY idx_user_id (user_id),
    KEY idx_status (status),
    KEY idx_requires_approval (requires_approval),
    KEY idx_created_at (created_at)
);

-- ============================================
-- DEFAULT DATA & SETTINGS
-- ============================================

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO admin_users (email, password, name, role) VALUES 
('admin@eventvenue.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDtRk1p6lKLGfpJk/dCTPnCJWQ7iCu', 'Admin', 'ADMIN');

-- Insert default conversion rate setting
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES 
('points_per_dollar', '100', 'Points conversion rate: how many points equal 1 dollar');

-- Withdrawal Requests Table (NO FOREIGN KEY - user_id can be from users OR vendors table)
DROP TABLE IF EXISTS withdrawal_requests;
CREATE TABLE withdrawal_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    points_amount INT NOT NULL,
    amount_usd DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    stripe_payout_id VARCHAR(255),
    admin_id BIGINT,
    admin_notes TEXT,
    requires_approval BOOLEAN DEFAULT FALSE,
    card_last4 VARCHAR(4),
    paypal_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_user_id (user_id),
    KEY idx_status (status)
);

-- Credit Requests Table (NO FOREIGN KEY - user_id can be from users OR vendors table)
DROP TABLE IF EXISTS credit_requests;
CREATE TABLE credit_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    points_requested INT NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    admin_id BIGINT,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_user_id (user_id),
    KEY idx_status (status)
);

-- Insert Stripe conversion ratio setting
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES 
('points_to_dollar_ratio', '0.01', 'Conversion ratio: 100 points = $1 (0.01 means divide points by 100)');

-- Insert platform commission setting
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES 
('platform_commission_percentage', '5.0', 'Platform commission percentage on transactions');

-- Platform fee settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES 
('user_platform_fee_points', '2', 'Points added to user booking costs');

INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES 
('venue_creation_points', '10', 'Points deducted from vendor for venue creation');

INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES 
('event_creation_points_quantity', '10', 'Points deducted for creating quantity-based event');

INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES 
('event_creation_points_seat', '20', 'Points deducted for creating seat-selection event');
