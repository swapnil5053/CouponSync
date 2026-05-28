-- Additional Sample Data for VCDS (without duplicate users)
-- Users already exist: IDs 1-11

-- Add more campaigns for different merchants
INSERT INTO campaigns (merchant_id, name, description, start_date, end_date, type, discount, max_redemptions, budget, status, total_coupons_generated, current_redemptions) VALUES
-- Tech Store Campaigns (merchant_id = 9)
(9, 'Tech Tuesday Sale', 'Weekly tech deals with amazing discounts', '2025-01-07 00:00:00', '2025-01-31 23:59:59', 'percentage', 15.00, 500, 5000.00, 'active', 100, 2),
(9, 'Gadget Giveaway', 'Buy one get one free on selected gadgets', '2025-01-15 00:00:00', '2025-02-15 23:59:59', 'bogo', 0.00, 200, 10000.00, 'scheduled', 50, 0),
-- Fashion Hub Campaigns (merchant_id = 10)
(10, 'Winter Fashion Sale', 'Up to 40% off on winter collection', '2025-01-01 00:00:00', '2025-01-31 23:59:59', 'percentage', 40.00, 1000, 20000.00, 'active', 200, 3),
(10, 'New Arrival Discount', '$25 off on orders above $100', '2025-01-10 00:00:00', '2025-02-28 23:59:59', 'fixed', 25.00, 300, 7500.00, 'active', 150, 1),
-- Food Mart Campaigns (merchant_id = 11)
(11, 'Free Delivery January', 'Free delivery on all orders', '2025-01-01 00:00:00', '2025-01-31 23:59:59', 'free_shipping', 0.00, 2000, 5000.00, 'active', 500, 4),
(11, 'Grocery Discount', '20% off on grocery items', '2025-01-05 00:00:00', '2025-01-25 23:59:59', 'percentage', 20.00, 800, 8000.00, 'active', 300, 2);

-- Get the campaign IDs we just inserted
SET @tech_sale_id = LAST_INSERT_ID();
SET @gadget_id = @tech_sale_id + 1;
SET @winter_id = @tech_sale_id + 2;
SET @newarrival_id = @tech_sale_id + 3;
SET @freeship_id = @tech_sale_id + 4;
SET @grocery_id = @tech_sale_id + 5;

-- Tech Tuesday Sale coupons
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(@tech_sale_id, 'TECH15-ABC123', SHA2('TECH15-ABC123', 256), '2025-01-31 23:59:59', 'redeemed', 4),
(@tech_sale_id, 'TECH15-DEF456', SHA2('TECH15-DEF456', 256), '2025-01-31 23:59:59', 'redeemed', 5),
(@tech_sale_id, 'TECH15-GHI789', SHA2('TECH15-GHI789', 256), '2025-01-31 23:59:59', 'assigned', 6),
(@tech_sale_id, 'TECH15-JKL012', SHA2('TECH15-JKL012', 256), '2025-01-31 23:59:59', 'available', NULL),
(@tech_sale_id, 'TECH15-MNO345', SHA2('TECH15-MNO345', 256), '2025-01-31 23:59:59', 'available', NULL);

-- Winter Fashion Sale coupons
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(@winter_id, 'WINTER40-XYZ111', SHA2('WINTER40-XYZ111', 256), '2025-01-31 23:59:59', 'redeemed', 4),
(@winter_id, 'WINTER40-ABC222', SHA2('WINTER40-ABC222', 256), '2025-01-31 23:59:59', 'redeemed', 5),
(@winter_id, 'WINTER40-DEF333', SHA2('WINTER40-DEF333', 256), '2025-01-31 23:59:59', 'redeemed', 6),
(@winter_id, 'WINTER40-GHI444', SHA2('WINTER40-GHI444', 256), '2025-01-31 23:59:59', 'assigned', 7),
(@winter_id, 'WINTER40-JKL555', SHA2('WINTER40-JKL555', 256), '2025-01-31 23:59:59', 'available', NULL);

-- New Arrival Discount coupons
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(@newarrival_id, 'NEWARRIVAL25-A1', SHA2('NEWARRIVAL25-A1', 256), '2025-02-28 23:59:59', 'redeemed', 4),
(@newarrival_id, 'NEWARRIVAL25-B2', SHA2('NEWARRIVAL25-B2', 256), '2025-02-28 23:59:59', 'assigned', 5),
(@newarrival_id, 'NEWARRIVAL25-C3', SHA2('NEWARRIVAL25-C3', 256), '2025-02-28 23:59:59', 'available', NULL),
(@newarrival_id, 'NEWARRIVAL25-D4', SHA2('NEWARRIVAL25-D4', 256), '2025-02-28 23:59:59', 'available', NULL);

-- Free Delivery coupons
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(@freeship_id, 'FREESHIP-JAN001', SHA2('FREESHIP-JAN001', 256), '2025-01-31 23:59:59', 'redeemed', 4),
(@freeship_id, 'FREESHIP-JAN002', SHA2('FREESHIP-JAN002', 256), '2025-01-31 23:59:59', 'redeemed', 5),
(@freeship_id, 'FREESHIP-JAN003', SHA2('FREESHIP-JAN003', 256), '2025-01-31 23:59:59', 'redeemed', 6),
(@freeship_id, 'FREESHIP-JAN004', SHA2('FREESHIP-JAN004', 256), '2025-01-31 23:59:59', 'redeemed', 7),
(@freeship_id, 'FREESHIP-JAN005', SHA2('FREESHIP-JAN005', 256), '2025-01-31 23:59:59', 'assigned', 8),
(@freeship_id, 'FREESHIP-JAN006', SHA2('FREESHIP-JAN006', 256), '2025-01-31 23:59:59', 'available', NULL);

-- Grocery Discount coupons
INSERT INTO coupons (campaign_id, code, code_hash, expires_at, status, assigned_to) VALUES
(@grocery_id, 'GROCERY20-X1Y2', SHA2('GROCERY20-X1Y2', 256), '2025-01-25 23:59:59', 'redeemed', 4),
(@grocery_id, 'GROCERY20-Z3A4', SHA2('GROCERY20-Z3A4', 256), '2025-01-25 23:59:59', 'redeemed', 5),
(@grocery_id, 'GROCERY20-B5C6', SHA2('GROCERY20-B5C6', 256), '2025-01-25 23:59:59', 'assigned', 6),
(@grocery_id, 'GROCERY20-D7E8', SHA2('GROCERY20-D7E8', 256), '2025-01-25 23:59:59', 'available', NULL);

-- Get coupon IDs for redemption logs
SET @coupon_tech1 = (SELECT id FROM coupons WHERE code = 'TECH15-ABC123');
SET @coupon_tech2 = (SELECT id FROM coupons WHERE code = 'TECH15-DEF456');
SET @coupon_winter1 = (SELECT id FROM coupons WHERE code = 'WINTER40-XYZ111');
SET @coupon_winter2 = (SELECT id FROM coupons WHERE code = 'WINTER40-ABC222');
SET @coupon_winter3 = (SELECT id FROM coupons WHERE code = 'WINTER40-DEF333');
SET @coupon_newarrival = (SELECT id FROM coupons WHERE code = 'NEWARRIVAL25-A1');
SET @coupon_ship1 = (SELECT id FROM coupons WHERE code = 'FREESHIP-JAN001');
SET @coupon_ship2 = (SELECT id FROM coupons WHERE code = 'FREESHIP-JAN002');
SET @coupon_ship3 = (SELECT id FROM coupons WHERE code = 'FREESHIP-JAN003');
SET @coupon_ship4 = (SELECT id FROM coupons WHERE code = 'FREESHIP-JAN004');
SET @coupon_grocery1 = (SELECT id FROM coupons WHERE code = 'GROCERY20-X1Y2');
SET @coupon_grocery2 = (SELECT id FROM coupons WHERE code = 'GROCERY20-Z3A4');

-- Add redemption logs with various scenarios
INSERT INTO redemption_logs (coupon_id, user_id, campaign_id, status, ip_address, user_agent, device_fingerprint, discount_applied, order_value, fraud_score, attempted_at) VALUES
-- Successful redemptions
(@coupon_tech1, 4, @tech_sale_id, 'success', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'fp_tech_user_001', 15.00, 100.00, 0.1, '2025-01-08 14:30:00'),
(@coupon_tech2, 5, @tech_sale_id, 'success', '192.168.1.11', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_tech_user_002', 22.50, 150.00, 0.0, '2025-01-09 16:45:00'),
(@coupon_winter1, 4, @winter_id, 'success', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'fp_fashion_user_001', 40.00, 100.00, 0.0, '2025-01-10 10:20:00'),
(@coupon_winter2, 5, @winter_id, 'success', '192.168.1.11', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_fashion_user_002', 80.00, 200.00, 0.1, '2025-01-11 15:30:00'),
(@coupon_winter3, 6, @winter_id, 'success', '192.168.1.12', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'fp_fashion_user_003', 60.00, 150.00, 0.0, '2025-01-12 12:15:00'),
(@coupon_newarrival, 4, @newarrival_id, 'success', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'fp_fashion_user_004', 25.00, 120.00, 0.0, '2025-01-13 09:00:00'),
(@coupon_ship1, 4, @freeship_id, 'success', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'fp_food_user_001', 5.00, 50.00, 0.0, '2025-01-06 18:30:00'),
(@coupon_ship2, 5, @freeship_id, 'success', '192.168.1.11', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_food_user_002', 5.00, 75.00, 0.0, '2025-01-07 11:20:00'),
(@coupon_ship3, 6, @freeship_id, 'success', '192.168.1.12', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'fp_food_user_003', 5.00, 60.00, 0.0, '2025-01-08 20:45:00'),
(@coupon_ship4, 7, @freeship_id, 'success', '192.168.1.13', 'Mozilla/5.0 (Android 11)', 'fp_food_user_004', 5.00, 90.00, 0.1, '2025-01-09 14:00:00'),
(@coupon_grocery1, 4, @grocery_id, 'success', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'fp_grocery_user_001', 20.00, 100.00, 0.0, '2025-01-14 08:30:00'),
(@coupon_grocery2, 5, @grocery_id, 'success', '192.168.1.11', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'fp_grocery_user_002', 15.00, 75.00, 0.0, '2025-01-15 19:15:00');

-- Add distribution logs for coupon assignments
INSERT INTO distribution_logs (coupon_id, recipient_id, recipient_email, channel, status, sent_at, delivered_at) VALUES
-- Email distributions
(@coupon_tech1, 4, 'john.doe@gmail.com', 'email', 'delivered', '2025-01-07 10:00:00', '2025-01-07 10:00:05'),
(@coupon_tech2, 5, 'jane.smith@yahoo.com', 'email', 'delivered', '2025-01-07 10:00:00', '2025-01-07 10:00:06'),
((SELECT id FROM coupons WHERE code = 'TECH15-GHI789'), 6, 'bob.wilson@gmail.com', 'email', 'delivered', '2025-01-07 10:00:00', '2025-01-07 10:00:07'),
(@coupon_winter1, 4, 'john.doe@gmail.com', 'email', 'delivered', '2025-01-05 09:00:00', '2025-01-05 09:00:03'),
(@coupon_winter2, 5, 'jane.smith@yahoo.com', 'email', 'delivered', '2025-01-05 09:00:00', '2025-01-05 09:00:04'),
(@coupon_winter3, 6, 'bob.wilson@gmail.com', 'email', 'delivered', '2025-01-05 09:00:00', '2025-01-05 09:00:05'),
((SELECT id FROM coupons WHERE code = 'WINTER40-GHI444'), 7, 'alice.brown@outlook.com', 'email', 'delivered', '2025-01-05 09:00:00', '2025-01-05 09:00:06'),
(@coupon_newarrival, 4, 'john.doe@gmail.com', 'email', 'delivered', '2025-01-10 08:00:00', '2025-01-10 08:00:02'),
((SELECT id FROM coupons WHERE code = 'NEWARRIVAL25-B2'), 5, 'jane.smith@yahoo.com', 'email', 'delivered', '2025-01-10 08:00:00', '2025-01-10 08:00:03'),
-- SMS distributions
(@coupon_ship1, 4, 'john.doe@gmail.com', 'sms', 'delivered', '2025-01-01 07:00:00', '2025-01-01 07:00:01'),
(@coupon_ship2, 5, 'jane.smith@yahoo.com', 'sms', 'delivered', '2025-01-01 07:00:00', '2025-01-01 07:00:02'),
(@coupon_ship3, 6, 'bob.wilson@gmail.com', 'sms', 'delivered', '2025-01-01 07:00:00', '2025-01-01 07:00:03'),
(@coupon_ship4, 7, 'alice.brown@outlook.com', 'sms', 'delivered', '2025-01-01 07:00:00', '2025-01-01 07:00:04'),
((SELECT id FROM coupons WHERE code = 'FREESHIP-JAN005'), 8, 'charlie.davis@gmail.com', 'sms', 'delivered', '2025-01-01 07:00:00', '2025-01-01 07:00:05'),
(@coupon_grocery1, 4, 'john.doe@gmail.com', 'email', 'delivered', '2025-01-05 06:00:00', '2025-01-05 06:00:02'),
(@coupon_grocery2, 5, 'jane.smith@yahoo.com', 'email', 'delivered', '2025-01-05 06:00:00', '2025-01-05 06:00:03'),
((SELECT id FROM coupons WHERE code = 'GROCERY20-B5C6'), 6, 'bob.wilson@gmail.com', 'email', 'delivered', '2025-01-05 06:00:00', '2025-01-05 06:00:04');

SELECT 'Additional sample data loaded successfully!' as message;
SELECT CONCAT('Total Campaigns: ', COUNT(*)) as stats FROM campaigns;
SELECT CONCAT('Total Coupons: ', COUNT(*)) as stats FROM coupons;
SELECT CONCAT('Total Redemptions: ', COUNT(*)) as stats FROM redemption_logs;
SELECT CONCAT('Total Distributions: ', COUNT(*)) as stats FROM distribution_logs;
