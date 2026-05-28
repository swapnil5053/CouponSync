-- Complete Sample Data for VCDS System
-- This file populates all tables with realistic test data

-- First, let's add more test users (customers and merchants)
INSERT INTO users (email, password_hash, name, role, phone, is_active, email_verified) VALUES
-- Regular customers (password: Customer@123)
('john.doe@gmail.com', '$2b$10$rZ5kLQx8pqYfJY9kXq9YzO7qC.9Zx8VqW7Y9Z8X7V6W5U4T3S2R1Q0', 'John Doe', 'user', '+1234567890', 1, 1),
('jane.smith@yahoo.com', '$2b$10$rZ5kLQx8pqYfJY9kXq9YzO7qC.9Zx8VqW7Y9Z8X7V6W5U4T3S2R1Q0', 'Jane Smith', 'user', '+1234567891', 1, 1),
('bob.wilson@gmail.com', '$2b$10$rZ5kLQx8pqYfJY9kXq9YzO7qC.9Zx8VqW7Y9Z8X7V6W5U4T3S2R1Q0', 'Bob Wilson', 'user', '+1234567892', 1, 1),
('alice.brown@outlook.com', '$2b$10$rZ5kLQx8pqYfJY9kXq9YzO7qC.9Zx8VqW7Y9Z8X7V6W5U4T3S2R1Q0', 'Alice Brown', 'user', '+1234567893', 1, 1),
('charlie.davis@gmail.com', '$2b$10$rZ5kLQx8pqYfJY9kXq9YzO7qC.9Zx8VqW7Y9Z8X7V6W5U4T3S2R1Q0', 'Charlie Davis', 'user', '+1234567894', 1, 1),
-- Additional merchants (password: Merchant@123)
('techstore@merchant.com', '$2b$10$rZ5kLQx8pqYfJY9kXq9YzO7qC.9Zx8VqW7Y9Z8X7V6W5U4T3S2R1Q0', 'Tech Store Inc', 'merchant', '+1234567895', 1, 1),
('fashionhub@merchant.com', '$2b$10$rZ5kLQx8pqYfJY9kXq9YzO7qC.9Zx8VqW7Y9Z8X7V6W5U4T3S2R1Q0', 'Fashion Hub', 'merchant', '+1234567896', 1, 1),
('foodmart@merchant.com', '$2b$10$rZ5kLQx8pqYfJY9kXq9YzO7qC.9Zx8VqW7Y9Z8X7V6W5U4T3S2R1Q0', 'Food Mart', 'merchant', '+1234567897', 1, 1);

-- Add more campaigns for different merchants
INSERT INTO campaigns (merchant_id, name, description, start_date, end_date, type, discount, max_redemptions, budget, status, total_coupons_generated) VALUES
-- Tech Store Campaigns (merchant_id will be 6)
(6, 'Tech Tuesday Sale', 'Weekly tech deals with amazing discounts', '2025-01-07 00:00:00', '2025-01-31 23:59:59', 'percentage', 15.00, 500, 5000.00, 'active', 100),
(6, 'Gadget Giveaway', 'Buy one get one free on selected gadgets', '2025-01-15 00:00:00', '2025-02-15 23:59:59', 'bogo', 0.00, 200, 10000.00, 'scheduled', 50),
-- Fashion Hub Campaigns (merchant_id will be 7)
(7, 'Winter Fashion Sale', 'Up to 40% off on winter collection', '2025-01-01 00:00:00', '2025-01-31 23:59:59', 'percentage', 40.00, 1000, 20000.00, 'active', 200),
(7, 'New Arrival Discount', '$25 off on orders above $100', '2025-01-10 00:00:00', '2025-02-28 23:59:59', 'fixed', 25.00, 300, 7500.00, 'active', 150),
-- Food Mart Campaigns (merchant_id will be 8)
(8, 'Free Delivery January', 'Free delivery on all orders', '2025-01-01 00:00:00', '2025-01-31 23:59:59', 'free_shipping', 0.00, 2000, 5000.00, 'active', 500),
(8, 'Grocery Discount', '20% off on grocery items', '2025-01-05 00:00:00', '2025-01-25 23:59:59', 'percentage', 20.00, 800, 8000.00, 'active', 300);

-- Generate more coupons for the new campaigns
-- Tech Tuesday Sale coupons (campaign_id will be around 8)
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(8, 'TECH15-ABC123', SHA2('TECH15-ABC123', 256), '2025-01-31 23:59:59', 'redeemed', 4),
(8, 'TECH15-DEF456', SHA2('TECH15-DEF456', 256), '2025-01-31 23:59:59', 'redeemed', 5),
(8, 'TECH15-GHI789', SHA2('TECH15-GHI789', 256), '2025-01-31 23:59:59', 'assigned', 6),
(8, 'TECH15-JKL012', SHA2('TECH15-JKL012', 256), '2025-01-31 23:59:59', 'available', NULL),
(8, 'TECH15-MNO345', SHA2('TECH15-MNO345', 256), '2025-01-31 23:59:59', 'available', NULL);

-- Winter Fashion Sale coupons (campaign_id will be around 10)
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(10, 'WINTER40-XYZ111', SHA2('WINTER40-XYZ111', 256), '2025-01-31 23:59:59', 'redeemed', 4),
(10, 'WINTER40-ABC222', SHA2('WINTER40-ABC222', 256), '2025-01-31 23:59:59', 'redeemed', 5),
(10, 'WINTER40-DEF333', SHA2('WINTER40-DEF333', 256), '2025-01-31 23:59:59', 'redeemed', 6),
(10, 'WINTER40-GHI444', SHA2('WINTER40-GHI444', 256), '2025-01-31 23:59:59', 'assigned', 7),
(10, 'WINTER40-JKL555', SHA2('WINTER40-JKL555', 256), '2025-01-31 23:59:59', 'available', NULL);

-- New Arrival Discount coupons (campaign_id will be around 11)
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(11, 'NEWARRIVAL25-A1', SHA2('NEWARRIVAL25-A1', 256), '2025-02-28 23:59:59', 'redeemed', 4),
(11, 'NEWARRIVAL25-B2', SHA2('NEWARRIVAL25-B2', 256), '2025-02-28 23:59:59', 'assigned', 5),
(11, 'NEWARRIVAL25-C3', SHA2('NEWARRIVAL25-C3', 256), '2025-02-28 23:59:59', 'available', NULL),
(11, 'NEWARRIVAL25-D4', SHA2('NEWARRIVAL25-D4', 256), '2025-02-28 23:59:59', 'available', NULL);

-- Free Delivery coupons (campaign_id will be around 12)
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(12, 'FREESHIP-JAN001', SHA2('FREESHIP-JAN001', 256), '2025-01-31 23:59:59', 'redeemed', 4),
(12, 'FREESHIP-JAN002', SHA2('FREESHIP-JAN002', 256), '2025-01-31 23:59:59', 'redeemed', 5),
(12, 'FREESHIP-JAN003', SHA2('FREESHIP-JAN003', 256), '2025-01-31 23:59:59', 'redeemed', 6),
(12, 'FREESHIP-JAN004', SHA2('FREESHIP-JAN004', 256), '2025-01-31 23:59:59', 'redeemed', 7),
(12, 'FREESHIP-JAN005', SHA2('FREESHIP-JAN005', 256), '2025-01-31 23:59:59', 'assigned', 8),
(12, 'FREESHIP-JAN006', SHA2('FREESHIP-JAN006', 256), '2025-01-31 23:59:59', 'available', NULL);

-- Grocery Discount coupons (campaign_id will be around 13)
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(13, 'GROCERY20-X1Y2', SHA2('GROCERY20-X1Y2', 256), '2025-01-25 23:59:59', 'redeemed', 4),
(13, 'GROCERY20-Z3A4', SHA2('GROCERY20-Z3A4', 256), '2025-01-25 23:59:59', 'redeemed', 5),
(13, 'GROCERY20-B5C6', SHA2('GROCERY20-B5C6', 256), '2025-01-25 23:59:59', 'assigned', 6),
(13, 'GROCERY20-D7E8', SHA2('GROCERY20-D7E8', 256), '2025-01-25 23:59:59', 'available', NULL);

-- Add more redemption logs with various scenarios
INSERT INTO redemption_logs (coupon_id, user_id, campaign_id, status, ip_address, user_agent, device_fingerprint, discount_applied, order_value, fraud_score, attempted_at) VALUES
-- Successful redemptions
((SELECT id FROM coupons WHERE code = 'TECH15-ABC123'), 4, 8, 'success', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'fp_tech_user_001', 15.00, 100.00, 0.1, '2025-01-08 14:30:00'),
((SELECT id FROM coupons WHERE code = 'TECH15-DEF456'), 5, 8, 'success', '192.168.1.11', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_tech_user_002', 22.50, 150.00, 0.0, '2025-01-09 16:45:00'),
((SELECT id FROM coupons WHERE code = 'WINTER40-XYZ111'), 4, 10, 'success', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'fp_fashion_user_001', 40.00, 100.00, 0.0, '2025-01-10 10:20:00'),
((SELECT id FROM coupons WHERE code = 'WINTER40-ABC222'), 5, 10, 'success', '192.168.1.11', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_fashion_user_002', 80.00, 200.00, 0.1, '2025-01-11 15:30:00'),
((SELECT id FROM coupons WHERE code = 'WINTER40-DEF333'), 6, 10, 'success', '192.168.1.12', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'fp_fashion_user_003', 60.00, 150.00, 0.0, '2025-01-12 12:15:00'),
((SELECT id FROM coupons WHERE code = 'NEWARRIVAL25-A1'), 4, 11, 'success', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'fp_fashion_user_004', 25.00, 120.00, 0.0, '2025-01-13 09:00:00'),
((SELECT id FROM coupons WHERE code = 'FREESHIP-JAN001'), 4, 12, 'success', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'fp_food_user_001', 5.00, 50.00, 0.0, '2025-01-06 18:30:00'),
((SELECT id FROM coupons WHERE code = 'FREESHIP-JAN002'), 5, 12, 'success', '192.168.1.11', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_food_user_002', 5.00, 75.00, 0.0, '2025-01-07 11:20:00'),
((SELECT id FROM coupons WHERE code = 'FREESHIP-JAN003'), 6, 12, 'success', '192.168.1.12', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'fp_food_user_003', 5.00, 60.00, 0.0, '2025-01-08 20:45:00'),
((SELECT id FROM coupons WHERE code = 'FREESHIP-JAN004'), 7, 12, 'success', '192.168.1.13', 'Mozilla/5.0 (Android 11)', 'fp_food_user_004', 5.00, 90.00, 0.1, '2025-01-09 14:00:00'),
((SELECT id FROM coupons WHERE code = 'GROCERY20-X1Y2'), 4, 13, 'success', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'fp_grocery_user_001', 20.00, 100.00, 0.0, '2025-01-14 08:30:00'),
((SELECT id FROM coupons WHERE code = 'GROCERY20-Z3A4'), 5, 13, 'success', '192.168.1.11', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_grocery_user_002', 15.00, 75.00, 0.0, '2025-01-15 19:15:00');

-- Add distribution logs for coupon assignments
INSERT INTO distribution_logs (coupon_id, recipient_id, recipient_email, channel, status, sent_at, delivered_at) VALUES
-- Email distributions
((SELECT id FROM coupons WHERE code = 'TECH15-ABC123'), 4, 'john.doe@gmail.com', 'email', 'delivered', '2025-01-07 10:00:00', '2025-01-07 10:00:05'),
((SELECT id FROM coupons WHERE code = 'TECH15-DEF456'), 5, 'jane.smith@yahoo.com', 'email', 'delivered', '2025-01-07 10:00:00', '2025-01-07 10:00:06'),
((SELECT id FROM coupons WHERE code = 'TECH15-GHI789'), 6, 'bob.wilson@gmail.com', 'email', 'delivered', '2025-01-07 10:00:00', '2025-01-07 10:00:07'),
((SELECT id FROM coupons WHERE code = 'WINTER40-XYZ111'), 4, 'john.doe@gmail.com', 'email', 'delivered', '2025-01-05 09:00:00', '2025-01-05 09:00:03'),
((SELECT id FROM coupons WHERE code = 'WINTER40-ABC222'), 5, 'jane.smith@yahoo.com', 'email', 'delivered', '2025-01-05 09:00:00', '2025-01-05 09:00:04'),
((SELECT id FROM coupons WHERE code = 'WINTER40-DEF333'), 6, 'bob.wilson@gmail.com', 'email', 'delivered', '2025-01-05 09:00:00', '2025-01-05 09:00:05'),
((SELECT id FROM coupons WHERE code = 'WINTER40-GHI444'), 7, 'alice.brown@outlook.com', 'email', 'delivered', '2025-01-05 09:00:00', '2025-01-05 09:00:06'),
((SELECT id FROM coupons WHERE code = 'NEWARRIVAL25-A1'), 4, 'john.doe@gmail.com', 'email', 'delivered', '2025-01-10 08:00:00', '2025-01-10 08:00:02'),
((SELECT id FROM coupons WHERE code = 'NEWARRIVAL25-B2'), 5, 'jane.smith@yahoo.com', 'email', 'delivered', '2025-01-10 08:00:00', '2025-01-10 08:00:03'),
-- SMS distributions
((SELECT id FROM coupons WHERE code = 'FREESHIP-JAN001'), 4, 'john.doe@gmail.com', 'sms', 'delivered', '2025-01-01 07:00:00', '2025-01-01 07:00:01'),
((SELECT id FROM coupons WHERE code = 'FREESHIP-JAN002'), 5, 'jane.smith@yahoo.com', 'sms', 'delivered', '2025-01-01 07:00:00', '2025-01-01 07:00:02'),
((SELECT id FROM coupons WHERE code = 'FREESHIP-JAN003'), 6, 'bob.wilson@gmail.com', 'sms', 'delivered', '2025-01-01 07:00:00', '2025-01-01 07:00:03'),
((SELECT id FROM coupons WHERE code = 'FREESHIP-JAN004'), 7, 'alice.brown@outlook.com', 'sms', 'delivered', '2025-01-01 07:00:00', '2025-01-01 07:00:04'),
((SELECT id FROM coupons WHERE code = 'FREESHIP-JAN005'), 8, 'charlie.davis@gmail.com', 'sms', 'delivered', '2025-01-01 07:00:00', '2025-01-01 07:00:05'),
((SELECT id FROM coupons WHERE code = 'GROCERY20-X1Y2'), 4, 'john.doe@gmail.com', 'email', 'delivered', '2025-01-05 06:00:00', '2025-01-05 06:00:02'),
((SELECT id FROM coupons WHERE code = 'GROCERY20-Z3A4'), 5, 'jane.smith@yahoo.com', 'email', 'delivered', '2025-01-05 06:00:00', '2025-01-05 06:00:03'),
((SELECT id FROM coupons WHERE code = 'GROCERY20-B5C6'), 6, 'bob.wilson@gmail.com', 'email', 'delivered', '2025-01-05 06:00:00', '2025-01-05 06:00:04');

-- Add some fraud detection logs
INSERT INTO fraud_detection_logs (redemption_id, user_id, ip_address, device_fingerprint, user_agent, fraud_score, fraud_reason, blocked_at) VALUES
-- Suspicious activity from same IP multiple times
(1, 4, '192.168.1.10', 'fp_fraud_001', 'Mozilla/5.0', 0.8, 'Multiple redemption attempts from same device', '2025-01-08 13:00:00'),
(3, 5, '192.168.1.50', 'fp_fraud_002', 'Mozilla/5.0', 0.9, 'Suspicious IP address detected', '2025-01-10 09:00:00'),
-- Expired coupon usage attempt
(11, 6, '192.168.1.12', 'fp_fraud_003', 'Mozilla/5.0', 0.7, 'Attempted to use expired coupon', '2025-01-26 10:00:00');

-- Update campaign statistics based on redemptions
UPDATE campaigns SET 
  current_redemptions = (SELECT COUNT(*) FROM redemption_logs WHERE campaign_id = campaigns.id AND status = 'success')
WHERE id IN (8, 10, 11, 12, 13);

SELECT 'Sample data loaded successfully!' as message;
SELECT CONCAT('Total Users: ', COUNT(*)) as stats FROM users;
SELECT CONCAT('Total Campaigns: ', COUNT(*)) as stats FROM campaigns;
SELECT CONCAT('Total Coupons: ', COUNT(*)) as stats FROM coupons;
SELECT CONCAT('Total Redemptions: ', COUNT(*)) as stats FROM redemption_logs;
SELECT CONCAT('Total Distributions: ', COUNT(*)) as stats FROM distribution_logs;
