-- Insert Sample Campaigns
INSERT INTO campaigns (merchant_id, name, description, start_date, end_date, type, discount, max_redemptions, budget, status, total_coupons_generated) VALUES
(2, 'Black Friday 2025', 'Exclusive Black Friday discounts up to 50% off on all products', '2025-11-20 00:00:00', '2025-11-30 23:59:59', 'percentage', 50.00, 1000, 50000.00, 'active', 10),
(2, 'New Year Special', 'Start 2026 with amazing deals! Flat $100 off on purchases above $500', '2025-12-25 00:00:00', '2026-01-10 23:59:59', 'fixed', 100.00, 500, 50000.00, 'active', 5),
(2, 'Winter Sale', '30% off on all winter collection items', '2025-11-01 00:00:00', '2026-02-28 23:59:59', 'percentage', 30.00, 2000, 60000.00, 'active', 5),
(2, 'Clearance Sale', 'End of season clearance - Up to 70% off', '2025-10-01 00:00:00', '2025-10-31 23:59:59', 'percentage', 70.00, 500, 35000.00, 'completed', 3),
(2, 'Summer Launch', 'Get ready for summer with 25% off', '2026-03-01 00:00:00', '2026-05-31 23:59:59', 'percentage', 25.00, 1500, 37500.00, 'scheduled', 0);

-- Get campaign IDs for coupon generation
SET @campaign1_id = (SELECT id FROM campaigns WHERE name = 'Black Friday 2025');
SET @campaign2_id = (SELECT id FROM campaigns WHERE name = 'New Year Special');
SET @campaign3_id = (SELECT id FROM campaigns WHERE name = 'Winter Sale');
SET @campaign4_id = (SELECT id FROM campaigns WHERE name = 'Clearance Sale');

-- Insert Sample Coupons for Black Friday Campaign
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(@campaign1_id, 'BF2025-A1B2C3D4E5', SHA2('BF2025-A1B2C3D4E5', 256), '2025-11-30 23:59:59', 'available', NULL),
(@campaign1_id, 'BF2025-F6G7H8I9J0', SHA2('BF2025-F6G7H8I9J0', 256), '2025-11-30 23:59:59', 'available', NULL),
(@campaign1_id, 'BF2025-K1L2M3N4O5', SHA2('BF2025-K1L2M3N4O5', 256), '2025-11-30 23:59:59', 'available', NULL),
(@campaign1_id, 'BF2025-P6Q7R8S9T0', SHA2('BF2025-P6Q7R8S9T0', 256), '2025-11-30 23:59:59', 'redeemed', 3),
(@campaign1_id, 'BF2025-U1V2W3X4Y5', SHA2('BF2025-U1V2W3X4Y5', 256), '2025-11-30 23:59:59', 'redeemed', 3),
(@campaign1_id, 'BF2025-Z6A7B8C9D0', SHA2('BF2025-Z6A7B8C9D0', 256), '2025-11-30 23:59:59', 'available', NULL),
(@campaign1_id, 'BF2025-E1F2G3H4I5', SHA2('BF2025-E1F2G3H4I5', 256), '2025-11-30 23:59:59', 'available', NULL),
(@campaign1_id, 'BF2025-J6K7L8M9N0', SHA2('BF2025-J6K7L8M9N0', 256), '2025-11-30 23:59:59', 'assigned', 3),
(@campaign1_id, 'BF2025-O1P2Q3R4S5', SHA2('BF2025-O1P2Q3R4S5', 256), '2025-11-30 23:59:59', 'available', NULL),
(@campaign1_id, 'BF2025-T6U7V8W9X0', SHA2('BF2025-T6U7V8W9X0', 256), '2025-11-30 23:59:59', 'available', NULL);

-- Insert Sample Coupons for New Year Campaign
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(@campaign2_id, 'NY2026-A1B2C3D4E5', SHA2('NY2026-A1B2C3D4E5', 256), '2026-01-10 23:59:59', 'available', NULL),
(@campaign2_id, 'NY2026-F6G7H8I9J0', SHA2('NY2026-F6G7H8I9J0', 256), '2026-01-10 23:59:59', 'available', NULL),
(@campaign2_id, 'NY2026-K1L2M3N4O5', SHA2('NY2026-K1L2M3N4O5', 256), '2026-01-10 23:59:59', 'available', NULL),
(@campaign2_id, 'NY2026-P6Q7R8S9T0', SHA2('NY2026-P6Q7R8S9T0', 256), '2026-01-10 23:59:59', 'available', NULL),
(@campaign2_id, 'NY2026-U1V2W3X4Y5', SHA2('NY2026-U1V2W3X4Y5', 256), '2026-01-10 23:59:59', 'assigned', 3);

-- Insert Sample Coupons for Winter Sale
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(@campaign3_id, 'WINTER-A1B2C3D4E5', SHA2('WINTER-A1B2C3D4E5', 256), '2026-02-28 23:59:59', 'available', NULL),
(@campaign3_id, 'WINTER-F6G7H8I9J0', SHA2('WINTER-F6G7H8I9J0', 256), '2026-02-28 23:59:59', 'available', NULL),
(@campaign3_id, 'WINTER-K1L2M3N4O5', SHA2('WINTER-K1L2M3N4O5', 256), '2026-02-28 23:59:59', 'available', NULL),
(@campaign3_id, 'WINTER-P6Q7R8S9T0', SHA2('WINTER-P6Q7R8S9T0', 256), '2026-02-28 23:59:59', 'available', NULL),
(@campaign3_id, 'WINTER-U1V2W3X4Y5', SHA2('WINTER-U1V2W3X4Y5', 256), '2026-02-28 23:59:59', 'redeemed', 3);

-- Insert Sample Coupons for Clearance Sale (Expired)
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(@campaign4_id, 'CLEAR-A1B2C3D4E5', SHA2('CLEAR-A1B2C3D4E5', 256), '2025-10-31 23:59:59', 'expired', NULL),
(@campaign4_id, 'CLEAR-F6G7H8I9J0', SHA2('CLEAR-F6G7H8I9J0', 256), '2025-10-31 23:59:59', 'expired', NULL),
(@campaign4_id, 'CLEAR-K1L2M3N4O5', SHA2('CLEAR-K1L2M3N4O5', 256), '2025-10-31 23:59:59', 'redeemed', 3);

-- Get coupon IDs for redemptions
SET @coupon1_id = (SELECT id FROM coupons WHERE code = 'BF2025-P6Q7R8S9T0');
SET @coupon2_id = (SELECT id FROM coupons WHERE code = 'BF2025-U1V2W3X4Y5');
SET @coupon3_id = (SELECT id FROM coupons WHERE code = 'WINTER-U1V2W3X4Y5');
SET @coupon4_id = (SELECT id FROM coupons WHERE code = 'CLEAR-K1L2M3N4O5');

-- Insert Sample Redemptions
INSERT INTO redemption_logs (coupon_id, user_id, campaign_id, status, ip_address, user_agent, device_fingerprint, discount_applied, order_value, fraud_score, attempted_at) VALUES
(@coupon1_id, 3, @campaign1_id, 'success', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_abc123xyz789', 125.00, 250.00, 0, '2025-11-05 10:30:00'),
(@coupon2_id, 3, @campaign1_id, 'success', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_abc123xyz789', 90.00, 180.00, 0, '2025-11-05 14:45:00'),
(@coupon3_id, 3, @campaign3_id, 'success', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_abc123xyz789', 36.00, 120.00, 0, '2025-11-04 16:20:00'),
(@coupon4_id, 3, @campaign4_id, 'success', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_abc123xyz789', 63.00, 90.00, 0, '2025-10-30 18:00:00');

-- Insert Sample Distribution Logs
INSERT INTO distribution_logs (coupon_id, recipient_id, recipient_email, channel, status, sent_at, delivered_at) VALUES
(@coupon1_id, 3, 'customer@example.com', 'email', 'delivered', '2025-11-01 09:00:00', '2025-11-01 09:00:15'),
(@coupon2_id, 3, 'customer@example.com', 'email', 'delivered', '2025-11-01 09:00:00', '2025-11-01 09:00:15'),
(@coupon3_id, 3, 'customer@example.com', 'sms', 'delivered', '2025-11-02 10:00:00', '2025-11-02 10:00:30'),
((SELECT id FROM coupons WHERE code = 'BF2025-J6K7L8M9N0'), 3, 'customer@example.com', 'email', 'delivered', '2025-11-03 11:00:00', '2025-11-03 11:00:20');

-- Insert Sample Fraud Attempts (for testing)
INSERT INTO fraud_attempts (coupon_id, user_id, attempted_at, ip_address, device_fingerprint, user_agent, fraud_score, fraud_reason, blocked) VALUES
((SELECT id FROM coupons WHERE code = 'BF2025-A1B2C3D4E5'), NULL, '2025-11-04 20:00:00', '45.123.45.67', 'fp_suspicious123', 'Python/3.9 urllib', 85, 'Suspicious user agent, High frequency attempts, Unknown device', 1),
((SELECT id FROM coupons WHERE code = 'NY2026-A1B2C3D4E5'), NULL, '2025-11-04 20:01:00', '45.123.45.67', 'fp_suspicious123', 'Python/3.9 urllib', 90, 'Suspicious user agent, Multiple rapid attempts, Blacklisted IP', 1);

-- Update campaign redemption counts
UPDATE campaigns c
SET current_redemptions = (SELECT COUNT(*) FROM coupons WHERE campaign_id = c.id AND status = 'redeemed')
WHERE id IN (@campaign1_id, @campaign2_id, @campaign3_id, @campaign4_id);
