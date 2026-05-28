-- Virtual Coupon Distribution System (VCDS) Database Schema
-- Drop existing tables if they exist
DROP TABLE IF EXISTS redemption_logs;
DROP TABLE IF EXISTS fraud_attempts;
DROP TABLE IF EXISTS distribution_logs;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS users;

-- Users Table (Supports both merchants and customers with RBAC)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'merchant', 'customer') NOT NULL DEFAULT 'customer',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Campaigns Table (EPIC 1: Campaign Management)
CREATE TABLE campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'fixed', 'bogo', 'free_shipping') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    type VARCHAR(50),
    discount DECIMAL(10, 2),
    budget DECIMAL(10, 2),
    target_audience JSON,
    metadata JSON,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    max_redemptions INT DEFAULT NULL,
    total_coupons_generated INT DEFAULT 0,
    total_redemptions INT DEFAULT 0,
    status ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'expired') DEFAULT 'draft',
    distribution_channels JSON, -- ['email', 'sms', 'qr']
    terms_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_merchant (merchant_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date),
    CONSTRAINT chk_dates CHECK (end_date > start_date),
    CONSTRAINT chk_discount CHECK (discount_value > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Coupons Table (EPIC 2: Code Generation & Security)
CREATE TABLE coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    code VARCHAR(255) UNIQUE NOT NULL,
    code_encrypted VARCHAR(500), -- AES-256 encrypted code
    user_id INT DEFAULT NULL, -- NULL for unassigned coupons
    status ENUM('generated', 'distributed', 'active', 'redeemed', 'expired', 'revoked') DEFAULT 'generated',
    expiry_date DATETIME NOT NULL,
    qr_code_url VARCHAR(500),
    is_used BOOLEAN DEFAULT FALSE,
    redeemed_at TIMESTAMP NULL,
    redeemed_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (redeemed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_campaign (campaign_id),
    INDEX idx_status (status),
    INDEX idx_user (user_id),
    INDEX idx_expiry (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Distribution Logs (EPIC 3: Distribution Module)
CREATE TABLE distribution_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_id INT NOT NULL,
    channel ENUM('email', 'sms', 'qr', 'link') NOT NULL,
    recipient VARCHAR(255) NOT NULL, -- email or phone
    status ENUM('pending', 'sent', 'delivered', 'failed', 'bounced') DEFAULT 'pending',
    attempt_count INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    last_attempt_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    error_message TEXT,
    metadata JSON, -- Additional tracking data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    INDEX idx_coupon (coupon_id),
    INDEX idx_status (status),
    INDEX idx_channel (channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Redemption Logs (EPIC 4: Redemption & Fraud Detection)
CREATE TABLE redemption_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    campaign_id INT NOT NULL,
    redemption_status ENUM('success', 'failed', 'duplicate', 'expired', 'invalid') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    location_data JSON,
    discount_applied DECIMAL(10, 2),
    transaction_id VARCHAR(255),
    failure_reason TEXT,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    INDEX idx_coupon (coupon_id),
    INDEX idx_user (user_id),
    INDEX idx_campaign (campaign_id),
    INDEX idx_status (redemption_status),
    INDEX idx_timestamp (redeemed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fraud Attempts (EPIC 4: Fraud Detection)
CREATE TABLE fraud_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    coupon_id INT DEFAULT NULL,
    fraud_type ENUM('duplicate_redemption', 'code_guessing', 'rate_limit', 'suspicious_pattern', 'expired_code') NOT NULL,
    ip_address VARCHAR(45),
    device_fingerprint VARCHAR(255),
    user_agent TEXT,
    attempt_details JSON,
    risk_score INT DEFAULT 0, -- 0-100
    blocked BOOLEAN DEFAULT FALSE,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_fraud_type (fraud_type),
    INDEX idx_ip (ip_address),
    INDEX idx_timestamp (detected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin user (password: Admin@123 - hashed with bcrypt)
INSERT INTO users (email, password_hash, name, role, is_active, email_verified) VALUES
('admin@vcds.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8qfnZMdlKgVL7JrEv.JtqfvfqYxVYi', 'System Admin', 'admin', TRUE, TRUE);

-- Insert sample merchant for testing
INSERT INTO users (email, password_hash, name, role, phone, is_active, email_verified) VALUES
('merchant@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8qfnZMdlKgVL7JrEv.JtqfvfqYxVYi', 'Sample Merchant', 'merchant', '+1234567890', TRUE, TRUE);

-- Insert sample customer
INSERT INTO users (email, password_hash, name, role, phone, is_active, email_verified) VALUES
('customer@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8qfnZMdlKgVL7JrEv.JtqfvfqYxVYi', 'John Doe', 'customer', '+1987654321', TRUE, TRUE);
