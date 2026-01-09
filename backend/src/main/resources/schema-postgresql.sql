-- ============================================
-- EventVenue COMPLETE PostgreSQL Schema
-- Ready for Supabase/Railway/Render Deployment
-- ============================================
-- COPY-PASTE this entire file into your PostgreSQL database
-- Run in: Supabase SQL Editor, Railway console, or pgAdmin

-- ============================================
-- DROP EXISTING TABLES (Optional - uncomment if recreating)
-- ============================================
-- DROP TABLE IF EXISTS withdrawal_requests CASCADE;
-- DROP TABLE IF EXISTS credit_requests CASCADE;
-- DROP TABLE IF EXISTS credit_transactions CASCADE;
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS event_seats CASCADE;
-- DROP TABLE IF EXISTS seat_categories CASCADE;
-- DROP TABLE IF EXISTS bookings CASCADE;
-- DROP TABLE IF EXISTS events CASCADE;
-- DROP TABLE IF EXISTS venues CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS points_history CASCADE;
-- DROP TABLE IF EXISTS otp_verifications CASCADE;
-- DROP TABLE IF EXISTS system_settings CASCADE;
-- DROP TABLE IF EXISTS admin_users CASCADE;
-- DROP TABLE IF EXISTS vendors CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- TABLE 1: USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    points BIGINT DEFAULT 2000,
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Composite unique constraint for email+role (allows same email with USER and VENDOR roles)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_role ON users(email, role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_role ON users(username, role) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- TABLE 2: VENDORS
-- ============================================
CREATE TABLE IF NOT EXISTS vendors (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    description TEXT,
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_vendors_username ON vendors(username);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_is_verified ON vendors(is_verified);

-- ============================================
-- TABLE 3: ADMIN USERS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ADMIN',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- ============================================
-- TABLE 4: VENUES
-- ============================================
CREATE TABLE IF NOT EXISTS venues (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
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
    -- Vendor contact (mandatory for display to users)
    vendor_phone VARCHAR(20) NOT NULL DEFAULT '',
    -- Edit limit tracking (max 2 edits for address/location)
    edit_count INT DEFAULT 0,
    is_edit_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_venues_vendor_id ON venues(vendor_id);
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_is_available ON venues(is_available);

-- ============================================
-- TABLE 5: EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    event_date TIMESTAMP NOT NULL,
    event_time TIME,
    location VARCHAR(255) NOT NULL,
    max_attendees INT,
    price_per_ticket DECIMAL(10, 2) NOT NULL,
    total_tickets INT NOT NULL,
    tickets_available INT NOT NULL,
    booking_type VARCHAR(20) DEFAULT 'QUANTITY',
    is_active BOOLEAN DEFAULT TRUE,
    images TEXT,
    -- Rating fields
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    -- Reschedule tracking
    reschedule_count INT DEFAULT 0,
    was_rescheduled BOOLEAN DEFAULT FALSE,
    last_rescheduled_at TIMESTAMP,
    reschedule_reason TEXT,
    original_event_date TIMESTAMP,
    original_location VARCHAR(255),
    -- Cancellation tracking
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP,
    -- Vendor contact (mandatory for display)
    vendor_phone VARCHAR(20) NOT NULL DEFAULT '',
    -- Edit limit tracking (max 2 edits)
    edit_count INT DEFAULT 0,
    is_edit_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_vendor_id ON events(vendor_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_is_cancelled ON events(is_cancelled);
CREATE INDEX IF NOT EXISTS idx_events_was_rescheduled ON events(was_rescheduled);

-- ============================================
-- TABLE 6: BOOKINGS
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(200),
    venue_id BIGINT REFERENCES venues(id) ON DELETE SET NULL,
    event_id BIGINT REFERENCES events(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    start_date DATE,
    end_date DATE,
    check_in_time TIME,
    check_out_time TIME,
    duration_hours INT,
    quantity INT DEFAULT 1,
    seat_ids TEXT,
    total_amount DECIMAL(10, 2) NOT NULL,
    points_used INT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    -- Refund tracking
    refund_amount DECIMAL(10, 2),
    refund_percentage INT,
    cancelled_at TIMESTAMP,
    -- PayPal hybrid payment tracking
    paypal_transaction_id VARCHAR(255),
    remaining_amount DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_venue_id ON bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- ============================================
-- TABLE 7: SEAT CATEGORIES (for SEAT_SELECTION events)
-- ============================================
CREATE TABLE IF NOT EXISTS seat_categories (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    color VARCHAR(20) DEFAULT '#22c55e',
    row_labels TEXT NOT NULL,
    seats_per_row INT NOT NULL,
    aisle_after TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seat_categories_event_id ON seat_categories(event_id);

-- ============================================
-- TABLE 8: EVENT SEATS
-- ============================================
CREATE TABLE IF NOT EXISTS event_seats (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES seat_categories(id) ON DELETE CASCADE,
    row_label VARCHAR(5) NOT NULL,
    seat_number INT NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    price DECIMAL(10, 2) NOT NULL,
    booking_id BIGINT REFERENCES bookings(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, row_label, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_event_seats_event_id ON event_seats(event_id);
CREATE INDEX IF NOT EXISTS idx_event_seats_category_id ON event_seats(category_id);
CREATE INDEX IF NOT EXISTS idx_event_seats_status ON event_seats(status);

-- ============================================
-- TABLE 9: PRODUCTS (Vendor products)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DOUBLE PRECISION NOT NULL,
    quantity INT DEFAULT 0,
    image_url VARCHAR(500),
    rating DOUBLE PRECISION DEFAULT 0.0,
    review_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- ============================================
-- TABLE 10: POINTS HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS points_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_changed BIGINT NOT NULL,
    reason VARCHAR(255),
    previous_points BIGINT,
    new_points BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);

-- ============================================
-- TABLE 11: OTP VERIFICATION
-- ============================================
CREATE TABLE IF NOT EXISTS otp_verifications (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_used BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_otp_email_role ON otp_verifications(email, role, is_used);

-- ============================================
-- TABLE 12: SYSTEM SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value VARCHAR(500),
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- ============================================
-- TABLE 13: REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id BIGINT REFERENCES venues(id) ON DELETE CASCADE,
    event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
    rating INT NOT NULL,
    comment TEXT,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_venue_id ON reviews(venue_id);
CREATE INDEX IF NOT EXISTS idx_reviews_event_id ON reviews(event_id);

-- ============================================
-- TABLE 14: AUDIT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    description VARCHAR(1000),
    performed_by VARCHAR(255),
    user_role VARCHAR(50),
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- TABLE 15: CREDIT TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS credit_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    amount_usd DECIMAL(10, 2),
    points_amount INT NOT NULL,
    stripe_payment_intent_id VARCHAR(255),
    stripe_payout_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_trans_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_trans_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_trans_status ON credit_transactions(status);
CREATE INDEX IF NOT EXISTS idx_credit_trans_created_at ON credit_transactions(created_at);

-- ============================================
-- TABLE 16: CREDIT REQUESTS (User requests for points)
-- ============================================
CREATE TABLE IF NOT EXISTS credit_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_requested INT NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    admin_id BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_req_user_id ON credit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_req_status ON credit_requests(status);
CREATE INDEX IF NOT EXISTS idx_credit_req_created_at ON credit_requests(created_at);

-- ============================================
-- TABLE 17: WITHDRAWAL REQUESTS (Vendor cash out)
-- ============================================
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_amount INT NOT NULL,
    amount_usd DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    stripe_payout_id VARCHAR(255),
    admin_id BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    requires_approval BOOLEAN DEFAULT FALSE,
    card_last4 VARCHAR(4),
    paypal_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requires_approval ON withdrawal_requests(requires_approval);
CREATE INDEX IF NOT EXISTS idx_withdrawal_created_at ON withdrawal_requests(created_at);

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default admin user (password: admin123)
-- BCrypt hash for 'admin123'
INSERT INTO admin_users (email, password, name, role) 
VALUES ('admin@eventvenue.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDtRk1p6lKLGfpJk/dCTPnCJWQ7iCu', 'Admin', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES ('points_per_dollar', '100', 'Points conversion rate: how many points equal 1 dollar')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES ('points_to_dollar_ratio', '0.01', 'Conversion ratio: 100 points = $1 (0.01 means divide points by 100)')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES ('platform_commission_percentage', '5.0', 'Platform commission percentage on transactions')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES ('min_withdrawal_points', '1000', 'Minimum points required for withdrawal')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES ('max_withdrawal_points_per_day', '50000', 'Maximum points that can be withdrawn per day')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- DONE! Your database is ready.
-- ============================================
-- Tables created: 17
-- Default admin: admin@eventvenue.com / admin123
-- Points per dollar: 100 (configurable in admin settings)
-- ============================================
