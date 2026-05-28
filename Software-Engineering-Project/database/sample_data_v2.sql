-- Clear existing data (in reverse order of foreign keys)
DELETE FROM distribution_logs;
DELETE FROM fraud_detection_logs;
DELETE FROM redemption_logs;
DELETE FROM redemptions;
DELETE FROM coupons;
DELETE FROM coupon_generation_logs;
DELETE FROM fraud_alerts;
DELETE FROM notifications;
DELETE FROM campaigns;

-- Reset auto-increment
ALTER TABLE campaigns AUTO_INCREMENT = 1;
ALTER TABLE coupons AUTO_INCREMENT = 1;
ALTER TABLE redemption_logs AUTO_INCREMENT = 1;
ALTER TABLE redemptions AUTO_INCREMENT = 1;
ALTER TABLE distribution_logs AUTO_INCREMENT = 1;
ALTER TABLE fraud_detection_logs AUTO_INCREMENT = 1;

-- Insert Sample Campaigns
INSERT INTO campaigns (merchant_id, name, description, start_date, end_date, type, discount, max_redemptions, budget, status, total_coupons_generated) VALUES
(2, 'Black Friday 2025', 'Exclusive Black Friday discounts up to 50% off on all products', '2025-11-20 00:00:00', '2025-11-30 23:59:59', 'percentage', 50.00, 1000, 50000.00, 'active', 10),
(2, 'New Year Special', 'Start 2026 with amazing deals! Flat $100 off on purchases above $500', '2025-12-25 00:00:00', '2026-01-10 23:59:59', 'fixed', 100.00, 500, 50000.00, 'active', 5),
(2, 'Winter Sale', '30% off on all winter collection items', '2025-11-01 00:00:00', '2026-02-28 23:59:59', 'percentage', 30.00, 2000, 60000.00, 'active', 5),
(2, 'Clearance Sale', 'End of season clearance - Up to 70% off', '2025-10-01 00:00:00', '2025-10-31 23:59:59', 'percentage', 70.00, 500, 35000.00, 'completed', 3),
(2, 'Summer Launch', 'Get ready for summer with 25% off', '2026-03-01 00:00:00', '2026-05-31 23:59:59', 'percentage', 25.00, 1500, 37500.00, 'scheduled', 0);

-- Insert Sample Coupons for Black Friday Campaign (ID = 1)
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(1, 'BF2025-A1B2C3D4E5', SHA2('BF2025-A1B2C3D4E5', 256), '2025-11-30 23:59:59', 'available', NULL),
(1, 'BF2025-F6G7H8I9J0', SHA2('BF2025-F6G7H8I9J0', 256), '2025-11-30 23:59:59', 'available', NULL),
(1, 'BF2025-K1L2M3N4O5', SHA2('BF2025-K1L2M3N4O5', 256), '2025-11-30 23:59:59', 'available', NULL),
(1, 'BF2025-P6Q7R8S9T0', SHA2('BF2025-P6Q7R8S9T0', 256), '2025-11-30 23:59:59', 'redeemed', 3),
(1, 'BF2025-U1V2W3X4Y5', SHA2('BF2025-U1V2W3X4Y5', 256), '2025-11-30 23:59:59', 'redeemed', 3),
(1, 'BF2025-Z6A7B8C9D0', SHA2('BF2025-Z6A7B8C9D0', 256), '2025-11-30 23:59:59', 'available', NULL),
(1, 'BF2025-E1F2G3H4I5', SHA2('BF2025-E1F2G3H4I5', 256), '2025-11-30 23:59:59', 'available', NULL),
(1, 'BF2025-J6K7L8M9N0', SHA2('BF2025-J6K7L8M9N0', 256), '2025-11-30 23:59:59', 'assigned', 3),
(1, 'BF2025-O1P2Q3R4S5', SHA2('BF2025-O1P2Q3R4S5', 256), '2025-11-30 23:59:59', 'available', NULL),
(1, 'BF2025-T6U7V8W9X0', SHA2('BF2025-T6U7V8W9X0', 256), '2025-11-30 23:59:59', 'available', NULL);

-- Insert Sample Coupons for New Year Campaign (ID = 2)
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(2, 'NY2026-A1B2C3D4E5', SHA2('NY2026-A1B2C3D4E5', 256), '2026-01-10 23:59:59', 'available', NULL),
(2, 'NY2026-F6G7H8I9J0', SHA2('NY2026-F6G7H8I9J0', 256), '2026-01-10 23:59:59', 'available', NULL),
(2, 'NY2026-K1L2M3N4O5', SHA2('NY2026-K1L2M3N4O5', 256), '2026-01-10 23:59:59', 'available', NULL),
(2, 'NY2026-P6Q7R8S9T0', SHA2('NY2026-P6Q7R8S9T0', 256), '2026-01-10 23:59:59', 'available', NULL),
(2, 'NY2026-U1V2W3X4Y5', SHA2('NY2026-U1V2W3X4Y5', 256), '2026-01-10 23:59:59', 'assigned', 3);

-- Insert Sample Coupons for Winter Sale (ID = 3)
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(3, 'WINTER-A1B2C3D4E5', SHA2('WINTER-A1B2C3D4E5', 256), '2026-02-28 23:59:59', 'available', NULL),
(3, 'WINTER-F6G7H8I9J0', SHA2('WINTER-F6G7H8I9J0', 256), '2026-02-28 23:59:59', 'available', NULL),
(3, 'WINTER-K1L2M3N4O5', SHA2('WINTER-K1L2M3N4O5', 256), '2026-02-28 23:59:59', 'available', NULL),
(3, 'WINTER-P6Q7R8S9T0', SHA2('WINTER-P6Q7R8S9T0', 256), '2026-02-28 23:59:59', 'available', NULL),
(3, 'WINTER-U1V2W3X4Y5', SHA2('WINTER-U1V2W3X4Y5', 256), '2026-02-28 23:59:59', 'redeemed', 3);

-- Insert Sample Coupons for Clearance Sale (ID = 4, Expired)
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(4, 'CLEAR-A1B2C3D4E5', SHA2('CLEAR-A1B2C3D4E5', 256), '2025-10-31 23:59:59', 'expired', NULL),
(4, 'CLEAR-F6G7H8I9J0', SHA2('CLEAR-F6G7H8I9J0', 256), '2025-10-31 23:59:59', 'expired', NULL),
(4, 'CLEAR-K1L2M3N4O5', SHA2('CLEAR-K1L2M3N4O5', 256), '2025-10-31 23:59:59', 'redeemed', 3);

-- Insert Sample Redemptions
INSERT INTO redemption_logs (coupon_id, user_id, campaign_id, status, ip_address, user_agent, device_fingerprint, discount_applied, order_value, fraud_score, attempted_at) VALUES
(4, 3, 1, 'success', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_abc123xyz789', 125.00, 250.00, 0, '2025-11-05 10:30:00'),
(5, 3, 1, 'success', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_abc123xyz789', 90.00, 180.00, 0, '2025-11-05 14:45:00'),
(20, 3, 3, 'success', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_abc123xyz789', 36.00, 120.00, 0, '2025-11-04 16:20:00'),
(23, 3, 4, 'success', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_abc123xyz789', 63.00, 90.00, 0, '2025-10-30 18:00:00');

-- Insert Sample Distribution Logs
INSERT INTO distribution_logs (coupon_id, recipient_id, recipient_email, channel, status, sent_at, delivered_at) VALUES
(4, 3, 'customer@example.com', 'email', 'delivered', '2025-11-01 09:00:00', '2025-11-01 09:00:15'),
(5, 3, 'customer@example.com', 'email', 'delivered', '2025-11-01 09:00:00', '2025-11-01 09:00:15'),
(20, 3, 'customer@example.com', 'sms', 'delivered', '2025-11-02 10:00:00', '2025-11-02 10:00:30'),
(8, 3, 'customer@example.com', 'email', 'delivered', '2025-11-03 11:00:00', '2025-11-03 11:00:20');

-- Update campaign redemption counts
UPDATE campaigns SET current_redemptions = (SELECT COUNT(*) FROM coupons WHERE campaign_id = campaigns.id AND status = 'redeemed');
