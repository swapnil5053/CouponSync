// Software-Engineering-Project/backend/seed_db.js
import pool from './db.js';
import bcrypt from 'bcryptjs';
import { encrypt } from './utils/security.js';

const seed = async () => {
  try {
    console.log('🌱 Seeding database...');

    // Clear existing data in reverse order of foreign keys
    await pool.query('DELETE FROM fraud_attempts');
    await pool.query('DELETE FROM redemption_logs');
    await pool.query('DELETE FROM distribution_logs');
    await pool.query('DELETE FROM coupons');
    await pool.query('DELETE FROM campaigns');
    await pool.query('DELETE FROM users');

    // Reset auto increments
    await pool.query('ALTER TABLE users AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE campaigns AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE coupons AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE distribution_logs AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE redemption_logs AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE fraud_attempts AUTO_INCREMENT = 1');

    // Hashed Passwords
    const adminHash = await bcrypt.hash('Admin@123', 10);
    const merchantHash = await bcrypt.hash('Merchant@123', 10);
    const customerHash = await bcrypt.hash('Customer@123', 10);

    // 1. Insert Users
    console.log('Inserting users...');
    const users = [
      // Admins
      { email: 'admin@vcds.com', password_hash: adminHash, name: 'System Admin', role: 'admin', phone: '+1111111111' },
      // Merchants
      { email: 'merchant@example.com', password_hash: adminHash, name: 'Sample Merchant', role: 'merchant', phone: '+1234567890' },
      { email: 'techstore@merchant.com', password_hash: merchantHash, name: 'Tech Store Inc', role: 'merchant', phone: '+1234567891' },
      { email: 'fashionhub@merchant.com', password_hash: merchantHash, name: 'Fashion Hub', role: 'merchant', phone: '+1234567892' },
      { email: 'foodmart@merchant.com', password_hash: merchantHash, name: 'Food Mart', role: 'merchant', phone: '+1234567893' },
      // Customers
      { email: 'customer@example.com', password_hash: customerHash, name: 'Sample Customer', role: 'customer', phone: '+1987654321' },
      { email: 'john.doe@gmail.com', password_hash: customerHash, name: 'John Doe', role: 'customer', phone: '+1234567894' },
      { email: 'jane.smith@yahoo.com', password_hash: customerHash, name: 'Jane Smith', role: 'customer', phone: '+1234567895' },
      { email: 'bob.wilson@gmail.com', password_hash: customerHash, name: 'Bob Wilson', role: 'customer', phone: '+1234567896' },
      { email: 'alice.brown@outlook.com', password_hash: customerHash, name: 'Alice Brown', role: 'customer', phone: '+1234567897' },
      { email: 'charlie.davis@gmail.com', password_hash: customerHash, name: 'Charlie Davis', role: 'customer', phone: '+1234567898' },
      // Preserve the user who signed up during test
      { email: 'pes1ug23am328@pesu.pes.edu', password_hash: '$2a$10$bWGq2yx9zh57L0FOhZLhOuROLaALO/d.dC65WwPVsN0UtNP4nRQ1S', name: 'Swapnil50533', role: 'customer', phone: '+919148491452' }
    ];

    const userEmailMap = {};
    for (const u of users) {
      const [res] = await pool.query(
        'INSERT INTO users (email, password_hash, name, role, phone, is_active, email_verified) VALUES (?, ?, ?, ?, ?, TRUE, TRUE)',
        [u.email, u.password_hash, u.name, u.role, u.phone]
      );
      userEmailMap[u.email] = res.insertId;
    }
    console.log('✓ Users inserted.');

    // 2. Insert Campaigns
    console.log('Inserting campaigns...');
    const campaigns = [
      { merchant_email: 'merchant@example.com', name: 'Black Friday 2025', description: 'Exclusive Black Friday discounts up to 50% off on all products', discount_type: 'percentage', discount_value: 50.00, start_date: '2025-11-20 00:00:00', end_date: '2025-11-30 23:59:59', max_redemptions: 1000, status: 'active' },
      { merchant_email: 'merchant@example.com', name: 'New Year Special', description: 'Flat $100 off on purchases above $500', discount_type: 'fixed', discount_value: 100.00, start_date: '2025-12-25 00:00:00', end_date: '2026-01-10 23:59:59', max_redemptions: 500, status: 'active' },
      { merchant_email: 'techstore@merchant.com', name: 'Tech Tuesday Sale', description: 'Weekly tech deals with amazing discounts', discount_type: 'percentage', discount_value: 15.00, start_date: '2026-01-07 00:00:00', end_date: '2026-08-31 23:59:59', max_redemptions: 500, status: 'active' },
      { merchant_email: 'fashionhub@merchant.com', name: 'Winter Fashion Sale', description: 'Up to 40% off on winter collection', discount_type: 'percentage', discount_value: 40.00, start_date: '2026-01-01 00:00:00', end_date: '2026-08-31 23:59:59', max_redemptions: 1000, status: 'active' },
      { merchant_email: 'foodmart@merchant.com', name: 'Grocery Discount', description: '20% off on grocery items', discount_type: 'percentage', discount_value: 20.00, start_date: '2026-01-05 00:00:00', end_date: '2026-08-31 23:59:59', max_redemptions: 800, status: 'active' },
      { merchant_email: 'techstore@merchant.com', name: 'Clearance Sale', description: 'End of season clearance - Flat $50 off', discount_type: 'fixed', discount_value: 50.00, start_date: '2025-10-01 00:00:00', end_date: '2025-10-31 23:59:59', max_redemptions: 500, status: 'expired' },
      { merchant_email: 'fashionhub@merchant.com', name: 'Summer Launch', description: 'Get ready for summer with 25% off', discount_type: 'percentage', discount_value: 25.00, start_date: '2026-06-01 00:00:00', end_date: '2026-08-31 23:59:59', max_redemptions: 1500, status: 'scheduled' }
    ];

    const campaignMap = {};
    for (const c of campaigns) {
      const merchantId = userEmailMap[c.merchant_email];
      const [res] = await pool.query(
        `INSERT INTO campaigns 
        (merchant_id, name, description, discount_type, discount_value, start_date, end_date, max_redemptions, status, distribution_channels) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [merchantId, c.name, c.description, c.discount_type, c.discount_value, c.start_date, c.end_date, c.max_redemptions, c.status, JSON.stringify(['email', 'sms', 'qr'])]
      );
      campaignMap[c.name] = { id: res.insertId, end_date: c.end_date };
    }
    console.log('✓ Campaigns inserted.');

    // 3. Insert Coupons
    console.log('Inserting coupons...');
    const coupons = [
      // Black Friday 2025 Coupons (Campaign 1)
      { campaign: 'Black Friday 2025', code: 'BF2025-A1B2C3', status: 'generated', expiry_date: campaignMap['Black Friday 2025'].end_date, user_email: null },
      { campaign: 'Black Friday 2025', code: 'BF2025-D4E5F6', status: 'redeemed', expiry_date: campaignMap['Black Friday 2025'].end_date, user_email: 'john.doe@gmail.com', redeemed_by: 'john.doe@gmail.com', redeemed_at: '2025-11-25 14:30:00', is_used: true },
      { campaign: 'Black Friday 2025', code: 'BF2025-G7H8I9', status: 'redeemed', expiry_date: campaignMap['Black Friday 2025'].end_date, user_email: 'customer@example.com', redeemed_by: 'customer@example.com', redeemed_at: '2025-11-26 10:15:00', is_used: true },
      { campaign: 'Black Friday 2025', code: 'BF2025-J0K1L2', status: 'distributed', expiry_date: campaignMap['Black Friday 2025'].end_date, user_email: 'jane.smith@yahoo.com' },
      
      // New Year Special Coupons (Campaign 2)
      { campaign: 'New Year Special', code: 'NY2026-X1Y2Z3', status: 'generated', expiry_date: campaignMap['New Year Special'].end_date, user_email: null },
      { campaign: 'New Year Special', code: 'NY2026-A4B5C6', status: 'distributed', expiry_date: campaignMap['New Year Special'].end_date, user_email: 'bob.wilson@gmail.com' },
      { campaign: 'New Year Special', code: 'NY2026-D7E8F9', status: 'redeemed', expiry_date: campaignMap['New Year Special'].end_date, user_email: 'john.doe@gmail.com', redeemed_by: 'john.doe@gmail.com', redeemed_at: '2025-12-28 16:45:00', is_used: true },
      
      // Tech Tuesday Sale Coupons (Campaign 3)
      { campaign: 'Tech Tuesday Sale', code: 'TECH15-ABC123', status: 'generated', expiry_date: campaignMap['Tech Tuesday Sale'].end_date, user_email: null },
      { campaign: 'Tech Tuesday Sale', code: 'TECH15-DEF456', status: 'distributed', expiry_date: campaignMap['Tech Tuesday Sale'].end_date, user_email: 'customer@example.com' },
      { campaign: 'Tech Tuesday Sale', code: 'TECH15-GHI789', status: 'redeemed', expiry_date: campaignMap['Tech Tuesday Sale'].end_date, user_email: 'jane.smith@yahoo.com', redeemed_by: 'jane.smith@yahoo.com', redeemed_at: '2026-01-10 11:20:00', is_used: true },
      
      // Winter Fashion Sale Coupons (Campaign 4)
      { campaign: 'Winter Fashion Sale', code: 'WINTER40-XYZ111', status: 'generated', expiry_date: campaignMap['Winter Fashion Sale'].end_date, user_email: null },
      { campaign: 'Winter Fashion Sale', code: 'WINTER40-ABC222', status: 'distributed', expiry_date: campaignMap['Winter Fashion Sale'].end_date, user_email: 'alice.brown@outlook.com' },
      { campaign: 'Winter Fashion Sale', code: 'WINTER40-DEF333', status: 'redeemed', expiry_date: campaignMap['Winter Fashion Sale'].end_date, user_email: 'charlie.davis@gmail.com', redeemed_by: 'charlie.davis@gmail.com', redeemed_at: '2026-01-12 18:30:00', is_used: true },
      
      // Grocery Discount Coupons (Campaign 5)
      { campaign: 'Grocery Discount', code: 'GROCERY20-X1Y2', status: 'generated', expiry_date: campaignMap['Grocery Discount'].end_date, user_email: null },
      { campaign: 'Grocery Discount', code: 'GROCERY20-Z3A4', status: 'distributed', expiry_date: campaignMap['Grocery Discount'].end_date, user_email: 'bob.wilson@gmail.com' },
      
      // Clearance Sale Coupons (Campaign 6 - Expired)
      { campaign: 'Clearance Sale', code: 'CLEAR-A1B2C3', status: 'expired', expiry_date: campaignMap['Clearance Sale'].end_date, user_email: null },
      { campaign: 'Clearance Sale', code: 'CLEAR-D4E5F6', status: 'redeemed', expiry_date: campaignMap['Clearance Sale'].end_date, user_email: 'john.doe@gmail.com', redeemed_by: 'john.doe@gmail.com', redeemed_at: '2025-10-15 09:00:00', is_used: true }
    ];

    const couponMap = {};
    for (const cp of coupons) {
      const camp = campaignMap[cp.campaign];
      const userId = cp.user_email ? userEmailMap[cp.user_email] : null;
      const redeemedById = cp.redeemed_by ? userEmailMap[cp.redeemed_by] : null;
      const codeEncrypted = encrypt(cp.code);

      const [res] = await pool.query(
        `INSERT INTO coupons 
        (campaign_id, code, code_encrypted, user_id, status, expiry_date, is_used, redeemed_at, redeemed_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [camp.id, cp.code, codeEncrypted, userId, cp.status, cp.expiry_date, cp.is_used || false, cp.redeemed_at || null, redeemedById]
      );
      couponMap[cp.code] = res.insertId;
    }
    console.log('✓ Coupons inserted.');

    // 4. Insert Redemption Logs
    console.log('Inserting redemption logs...');
    const redemptions = [
      { code: 'BF2025-D4E5F6', user_email: 'john.doe@gmail.com', campaign: 'Black Friday 2025', status: 'success', discount_applied: 50.00, redeemed_at: '2025-11-25 14:30:00', ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
      { code: 'BF2025-G7H8I9', user_email: 'customer@example.com', campaign: 'Black Friday 2025', status: 'success', discount_applied: 25.00, redeemed_at: '2025-11-26 10:15:00', ip_address: '192.168.1.101', user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) Safari/604.1' },
      { code: 'NY2026-D7E8F9', user_email: 'john.doe@gmail.com', campaign: 'New Year Special', status: 'success', discount_applied: 100.00, redeemed_at: '2025-12-28 16:45:00', ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
      { code: 'TECH15-GHI789', user_email: 'jane.smith@yahoo.com', campaign: 'Tech Tuesday Sale', status: 'success', discount_applied: 15.00, redeemed_at: '2026-01-10 11:20:00', ip_address: '192.168.1.102', user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0' },
      { code: 'WINTER40-DEF333', user_email: 'charlie.davis@gmail.com', campaign: 'Winter Fashion Sale', status: 'success', discount_applied: 40.00, redeemed_at: '2026-01-12 18:30:00', ip_address: '192.168.1.103', user_agent: 'Mozilla/5.0 (Linux; Android 10; K) Chrome/120.0.0.0' },
      { code: 'CLEAR-D4E5F6', user_email: 'john.doe@gmail.com', campaign: 'Clearance Sale', status: 'success', discount_applied: 50.00, redeemed_at: '2025-10-15 09:00:00', ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' }
    ];

    for (const r of redemptions) {
      const couponId = couponMap[r.code];
      const userId = userEmailMap[r.user_email];
      const camp = campaignMap[r.campaign];

      await pool.query(
        `INSERT INTO redemption_logs 
        (coupon_id, user_id, campaign_id, redemption_status, ip_address, user_agent, discount_applied, redeemed_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [couponId, userId, camp.id, r.status, r.ip_address, r.user_agent, r.discount_applied, r.redeemed_at]
      );
    }
    console.log('✓ Redemption logs inserted.');

    // 5. Insert Fraud Attempts
    console.log('Inserting fraud attempts...');
    const fraud = [
      { user_email: 'john.doe@gmail.com', code: 'BF2025-D4E5F6', fraud_type: 'duplicate_redemption', ip_address: '192.168.1.100', device_fingerprint: 'device-fingerprint-john', user_agent: 'Mozilla/5.0', risk_score: 50, blocked: false, detected_at: '2025-11-26 12:00:00' },
      { user_email: null, code: 'TECH15-ABC123', fraud_type: 'code_guessing', ip_address: '203.0.113.50', device_fingerprint: 'device-fingerprint-attacker', user_agent: 'Python/3.10 requests', risk_score: 85, blocked: true, detected_at: '2026-02-01 23:45:00' }
    ];

    for (const f of fraud) {
      const couponId = f.code ? couponMap[f.code] : null;
      const userId = f.user_email ? userEmailMap[f.user_email] : null;

      await pool.query(
        `INSERT INTO fraud_attempts 
        (user_id, coupon_id, fraud_type, ip_address, device_fingerprint, user_agent, risk_score, blocked, detected_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, couponId, f.fraud_type, f.ip_address, f.device_fingerprint, f.user_agent, f.risk_score, f.blocked, f.detected_at]
      );
    }
    console.log('✓ Fraud attempts inserted.');

    // Update campaign statistics
    console.log('Updating campaign totals...');
    for (const name in campaignMap) {
      const camp = campaignMap[name];
      await pool.query(
        `UPDATE campaigns c SET 
          total_coupons_generated = (SELECT COUNT(*) FROM coupons WHERE campaign_id = c.id),
          total_redemptions = (SELECT COUNT(*) FROM coupons WHERE campaign_id = c.id AND status = 'redeemed')
        WHERE id = ?`,
        [camp.id]
      );
    }
    console.log('✓ Campaign stats updated.');

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

seed();
