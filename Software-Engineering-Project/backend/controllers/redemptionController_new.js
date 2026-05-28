// EPIC 4: Coupon Redemption and Fraud Detection Controller
import pool from "../db.js";
import { generateDeviceFingerprint, calculateFraudScore } from '../utils/security.js';

/**
 * EPIC 4: Story 1 & 2 - Redeem coupon with validation and fraud detection
 */
export const redeemCoupon = async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    // Accept both formats: code/coupon_code and order_amount/transaction_amount
    const code = req.body.code || req.body.coupon_code;
    const transaction_id = req.body.transaction_id;
    const order_amount = req.body.order_amount || req.body.transaction_amount || 0;
    
    const user_id = req.user ? req.user.id : null;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'];
    const device_fingerprint = generateDeviceFingerprint(req);
    
    console.log('=== REDEMPTION REQUEST ===');
    console.log('Code:', code);
    console.log('Order Amount:', order_amount);
    console.log('User ID:', user_id);
    
    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }
    
    await conn.beginTransaction();
    
    // EPIC 4: Story 1 - Validate coupon
    const [coupons] = await conn.query(
      `SELECT c.*, 
              camp.discount_type, 
              camp.discount_value, 
              camp.status as campaign_status, 
              camp.name as campaign_name
       FROM coupons c
       LEFT JOIN campaigns camp ON c.campaign_id = camp.id
       WHERE UPPER(c.code) = UPPER(?)`,
      [code]
    );
    
    console.log('Coupons found:', coupons.length);
    if (coupons.length > 0) {
      console.log('Coupon details:', {
        id: coupons[0].id,
        code: coupons[0].code,
        status: coupons[0].status,
        is_used: coupons[0].is_used,
        user_id: coupons[0].user_id,
        campaign_status: coupons[0].campaign_status,
        discount_type: coupons[0].discount_type,
        discount_value: coupons[0].discount_value,
        expiry_date: coupons[0].expiry_date
      });
    }
    
    console.log('Coupons found:', coupons.length);
    if (coupons.length > 0) {
      console.log('Coupon details:', {
        id: coupons[0].id,
        code: coupons[0].code,
        status: coupons[0].status,
        is_used: coupons[0].is_used,
        user_id: coupons[0].user_id,
        campaign_status: coupons[0].campaign_status,
        expiry_date: coupons[0].expiry_date
      });
    }
    
    if (coupons.length === 0) {
      // Log invalid attempt
      await conn.query(
        `INSERT INTO redemption_logs (coupon_id, user_id, campaign_id, redemption_status, ip_address, user_agent, device_fingerprint, failure_reason) 
         VALUES (NULL, ?, NULL, 'invalid', ?, ?, ?, 'Coupon code not found')`,
        [user_id, ip_address, user_agent, device_fingerprint]
      );
      await conn.commit();
      return res.status(404).json({ message: 'Invalid coupon code', redemption_status: 'invalid' });
    }
    
    const coupon = coupons[0];
    
    // EPIC 4: Story 5 - Check if coupon is expired
    if (new Date(coupon.expiry_date) < new Date()) {
      await conn.query(
        `INSERT INTO redemption_logs (coupon_id, user_id, campaign_id, redemption_status, ip_address, user_agent, device_fingerprint, failure_reason) 
         VALUES (?, ?, ?, 'expired', ?, ?, ?, 'Coupon has expired')`,
        [coupon.id, user_id, coupon.campaign_id, ip_address, user_agent, device_fingerprint]
      );
      
      // Update coupon status
      await conn.query('UPDATE coupons SET status = ? WHERE id = ?', ['expired', coupon.id]);
      
      await conn.commit();
      return res.status(400).json({ message: 'This coupon has expired', redemption_status: 'expired' });
    }
    
    // EPIC 4: Story 2 - Check if already redeemed
    if (coupon.is_used) {
      await conn.query(
        `INSERT INTO redemption_logs (coupon_id, user_id, campaign_id, redemption_status, ip_address, user_agent, device_fingerprint, failure_reason) 
         VALUES (?, ?, ?, 'duplicate', ?, ?, ?, 'Coupon already redeemed')`,
        [coupon.id, user_id, coupon.campaign_id, ip_address, user_agent, device_fingerprint]
      );
      
      // Log fraud attempt
      await conn.query(
        `INSERT INTO fraud_attempts (user_id, coupon_id, fraud_type, ip_address, device_fingerprint, user_agent, risk_score) 
         VALUES (?, ?, 'duplicate_redemption', ?, ?, ?, 50)`,
        [user_id, coupon.id, ip_address, device_fingerprint, user_agent]
      );
      
      await conn.commit();
      return res.status(400).json({ message: 'This coupon has already been redeemed', redemption_status: 'duplicate' });
    }
    
    // Check campaign status
    if (coupon.campaign_status !== 'active') {
      await conn.query(
        `INSERT INTO redemption_logs (coupon_id, user_id, campaign_id, redemption_status, ip_address, user_agent, device_fingerprint, failure_reason) 
         VALUES (?, ?, ?, 'failed', ?, ?, ?, 'Campaign is not active')`,
        [coupon.id, user_id, coupon.campaign_id, ip_address, user_agent, device_fingerprint]
      );
      await conn.commit();
      return res.status(400).json({ message: 'Campaign is not active', redemption_status: 'failed' });
    }
    
    // EPIC 4: Story 4 - Fraud detection
    const [redemptionHistory] = await conn.query(
      'SELECT * FROM redemption_logs WHERE user_id = ? ORDER BY redeemed_at DESC LIMIT 20',
      [user_id]
    );
    
    const [ipHistory] = await conn.query(
      'SELECT * FROM redemption_logs WHERE ip_address = ? AND redeemed_at > DATE_SUB(NOW(), INTERVAL 1 DAY)',
      [ip_address]
    );
    
    const [deviceHistory] = await conn.query(
      'SELECT * FROM redemption_logs WHERE device_fingerprint = ? AND redeemed_at > DATE_SUB(NOW(), INTERVAL 1 DAY)',
      [device_fingerprint]
    );
    
    const fraudScore = calculateFraudScore(redemptionHistory, ipHistory, deviceHistory);
    
    // If fraud score is high, log and potentially block
    if (fraudScore > 70) {
      await conn.query(
        `INSERT INTO fraud_attempts (user_id, coupon_id, fraud_type, ip_address, device_fingerprint, user_agent, risk_score, blocked, attempt_details) 
         VALUES (?, ?, 'suspicious_pattern', ?, ?, ?, ?, TRUE, ?)`,
        [user_id, coupon.id, ip_address, device_fingerprint, user_agent, fraudScore, JSON.stringify({ redemption_count: redemptionHistory.length, ip_count: ipHistory.length })]
      );
      
      await conn.query(
        `INSERT INTO redemption_logs (coupon_id, user_id, campaign_id, redemption_status, ip_address, user_agent, device_fingerprint, failure_reason) 
         VALUES (?, ?, ?, 'failed', ?, ?, ?, 'High fraud risk detected')`,
        [coupon.id, user_id, coupon.campaign_id, ip_address, user_agent, device_fingerprint]
      );
      
      await conn.commit();
      return res.status(403).json({ message: 'Suspicious activity detected. Please contact support.', redemption_status: 'blocked' });
    }
    
    // EPIC 4: Story 1 - Redeem coupon successfully
    const discount_applied = coupon.discount_type === 'percentage' 
      ? (order_amount * coupon.discount_value / 100) 
      : coupon.discount_value;
    
    const final_amount = Math.max(0, order_amount - discount_applied);
    
    // Update coupon status
    await conn.query(
      'UPDATE coupons SET is_used = TRUE, status = ?, redeemed_at = NOW(), redeemed_by = ? WHERE id = ?',
      ['redeemed', user_id, coupon.id]
    );
    
    // Update campaign statistics
    await conn.query(
      'UPDATE campaigns SET total_redemptions = total_redemptions + 1 WHERE id = ?',
      [coupon.campaign_id]
    );
    
    // EPIC 4: Story 3 - Log successful redemption
    await conn.query(
      `INSERT INTO redemption_logs (coupon_id, user_id, campaign_id, redemption_status, ip_address, user_agent, device_fingerprint, discount_applied, transaction_id) 
       VALUES (?, ?, ?, 'success', ?, ?, ?, ?, ?)`,
      [coupon.id, user_id, coupon.campaign_id, ip_address, user_agent, device_fingerprint, discount_applied, transaction_id]
    );
    
    await conn.commit();
    
    res.json({
      message: 'Coupon redeemed successfully!',
      redemption_status: 'success',
      coupon_code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_applied,
      final_amount,
      original_amount: order_amount,
      redeemed_at: new Date()
    });
    
  } catch (err) {
    await conn.rollback();
    console.error('Redeem coupon error:', err);
    res.status(500).json({ message: "Error redeeming coupon", error: err.message });
  } finally {
    conn.release();
  }
};

/**
 * EPIC 4: Story 1 - Validate coupon without redeeming
 */
export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    
    const [coupons] = await pool.query(
      `SELECT c.*, camp.name as campaign_name, camp.discount_type, camp.discount_value, camp.status as campaign_status
       FROM coupons c
       LEFT JOIN campaigns camp ON c.campaign_id = camp.id
       WHERE c.code = ?`,
      [code]
    );
    
    if (coupons.length === 0) {
      return res.status(404).json({ valid: false, message: 'Invalid coupon code' });
    }
    
    const coupon = coupons[0];
    
    if (coupon.is_used) {
      return res.json({ valid: false, message: 'Coupon already used' });
    }
    
    if (new Date(coupon.expiry_date) < new Date()) {
      return res.json({ valid: false, message: 'Coupon expired' });
    }
    
    if (coupon.campaign_status !== 'active') {
      return res.json({ valid: false, message: 'Campaign not active' });
    }
    
    res.json({
      valid: true,
      message: 'Coupon is valid',
      coupon: {
        code: coupon.code,
        campaign_name: coupon.campaign_name,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        expiry_date: coupon.expiry_date
      }
    });
    
  } catch (err) {
    console.error('Validate coupon error:', err);
    res.status(500).json({ message: "Error validating coupon", error: err.message });
  }
};

/**
 * EPIC 4: Story 3 - Get redemption history
 */
export const getRedemptionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, campaign_id } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT rl.*, 
        c.code as coupon_code,
        camp.name as campaign_name,
        u.name as user_name,
        u.email as user_email
      FROM redemption_logs rl
      LEFT JOIN coupons c ON rl.coupon_id = c.id
      LEFT JOIN campaigns camp ON rl.campaign_id = camp.id
      LEFT JOIN users u ON rl.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Role-based filtering
    if (req.user.role === 'merchant') {
      query += ' AND camp.merchant_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'customer') {
      query += ' AND rl.user_id = ?';
      params.push(req.user.id);
    }
    
    if (status) {
      query += ' AND rl.redemption_status = ?';
      params.push(status);
    }
    
    if (campaign_id) {
      query += ' AND rl.campaign_id = ?';
      params.push(campaign_id);
    }
    
    // Count
    const countQuery = query.replace(/SELECT rl\.\*[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult ? (countResult[0]?.total || 0) : 0;
    
    query += ' ORDER BY rl.redeemed_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [logs] = await pool.query(query, params);
    
    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get redemption history error:', err);
    res.status(500).json({ message: "Error fetching redemption history", error: err.message });
  }
};

/**
 * EPIC 4: Story 4 - Get fraud attempts
 */
export const getFraudAttempts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const [total_result] = await pool.query('SELECT COUNT(*) as total FROM fraud_attempts');
    const total = total_result[0].total;
    
    const [attempts] = await pool.query(
      `SELECT fa.*, u.name as user_name, u.email as user_email, c.code as coupon_code
       FROM fraud_attempts fa
       LEFT JOIN users u ON fa.user_id = u.id
       LEFT JOIN coupons c ON fa.coupon_id = c.id
       ORDER BY fa.detected_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );
    
    res.json({
      attempts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get fraud attempts error:', err);
    res.status(500).json({ message: "Error fetching fraud attempts", error: err.message });
  }
};

export default {
  redeemCoupon,
  validateCoupon,
  getRedemptionHistory,
  getFraudAttempts
};
