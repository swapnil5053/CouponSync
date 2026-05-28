// Simple Coupon Redemption Controller
import pool from "../db.js";

/**
 * Simple coupon redemption - validate and redeem
 */
export const redeemCoupon = async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    const code = req.body.code || req.body.coupon_code;
    const order_amount = req.body.order_amount || req.body.transaction_amount || 0;
    const user_id = req.user ? req.user.id : null;
    
    console.log('=== REDEMPTION REQUEST ===');
    console.log('Code:', code);
    console.log('Order Amount:', order_amount);
    console.log('User ID:', user_id);
    
    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }
    
    await conn.beginTransaction();
    
    // Find the coupon
    const [coupons] = await conn.query(
      `SELECT c.*, 
              camp.type as discount_type, 
              camp.discount as discount_value, 
              camp.status as campaign_status, 
              camp.name as campaign_name
       FROM coupons c
       LEFT JOIN campaigns camp ON c.campaign_id = camp.id
       WHERE UPPER(c.code) = UPPER(?)`,
      [code]
    );
    
    if (coupons.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Invalid coupon code' });
    }
    
    const coupon = coupons[0];
    console.log('Found coupon:', coupon.id, 'Status:', coupon.status);
    
    // Check if campaign is active
    if (coupon.campaign_status !== 'active') {
      await conn.rollback();
      return res.status(400).json({ message: 'Campaign is not active' });
    }
    
    // Check if already redeemed
    if (coupon.status === 'redeemed') {
      await conn.rollback();
      return res.status(400).json({ message: 'This coupon has already been redeemed' });
    }
    
    // Calculate discount
    let discount_applied = 0;
    if (coupon.discount_type === 'percentage') {
      discount_applied = (order_amount * parseFloat(coupon.discount_value)) / 100;
    } else if (coupon.discount_type === 'fixed') {
      discount_applied = parseFloat(coupon.discount_value);
    }
    
    const final_amount = Math.max(0, order_amount - discount_applied);
    
    console.log('Discount calculation:', {
      type: coupon.discount_type,
      value: coupon.discount_value,
      order_amount,
      discount_applied,
      final_amount
    });
    
    // Update coupon status to redeemed
    await conn.query(
      'UPDATE coupons SET status = ?, is_used = TRUE, redeemed_at = NOW(), redeemed_by = ? WHERE id = ?',
      ['redeemed', user_id, coupon.id]
    );

    // Update campaign statistics
    await conn.query(
      'UPDATE campaigns SET total_redemptions = total_redemptions + 1 WHERE id = ?',
      [coupon.campaign_id]
    );
    
    // Try to insert redemption log
    try {
      await conn.query(
        `INSERT INTO redemption_logs (coupon_id, user_id, campaign_id, redemption_status, discount_applied) 
         VALUES (?, ?, ?, 'success', ?)`,
        [coupon.id, user_id, coupon.campaign_id, discount_applied]
      );
    } catch (logErr) {
      console.log('Note: Could not insert into redemption_logs:', logErr.message);
    }
    
    await conn.commit();
    
    console.log('✅ Redemption successful!');
    
    res.status(200).json({
      success: true,
      message: 'Coupon redeemed successfully',
      coupon_code: code,
      campaign_name: coupon.campaign_name,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      original_amount: order_amount,
      discount_applied: discount_applied,
      final_amount: final_amount
    });
    
  } catch (err) {
    await conn.rollback();
    console.error('Redeem coupon error:', err);
    res.status(500).json({ 
      message: 'Error redeeming coupon', 
      error: err.message 
    });
  } finally {
    conn.release();
  }
};

/**
 * Validate a coupon without redeeming it
 */
export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    
    const [coupons] = await pool.query(
      `SELECT c.*, 
              camp.type as discount_type, 
              camp.discount as discount_value, 
              camp.status as campaign_status, 
              camp.name as campaign_name
       FROM coupons c
       LEFT JOIN campaigns camp ON c.campaign_id = camp.id
       WHERE UPPER(c.code) = UPPER(?)`,
      [code]
    );
    
    if (coupons.length === 0) {
      return res.status(404).json({ 
        valid: false, 
        message: 'Invalid coupon code' 
      });
    }
    
    const coupon = coupons[0];
    
    const isValid = coupon.campaign_status === 'active' && coupon.status !== 'redeemed';
    
    res.json({
      valid: isValid,
      coupon: {
        code: coupon.code,
        campaign_name: coupon.campaign_name,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        status: coupon.status
      }
    });
    
  } catch (err) {
    console.error('Validate coupon error:', err);
    res.status(500).json({ message: 'Error validating coupon' });
  }
};

/**
 * Get redemption history for a user
 */
export const getRedemptionHistory = async (req, res) => {
  try {
    const user_id = req.user.id;
    const user_role = req.user.role;
    
    let query = `
      SELECT 
        rl.*, 
        c.code as coupon_code,
        c.status as coupon_status,
        rl.redeemed_at as redeemed_at,
        camp.name as campaign_name,
        camp.type as discount_type,
        camp.discount as discount_value,
        u.email as user_email,
        'success' as redemption_status
      FROM redemption_logs rl
      LEFT JOIN coupons c ON rl.coupon_id = c.id
      LEFT JOIN campaigns camp ON rl.campaign_id = camp.id
      LEFT JOIN users u ON rl.user_id = u.id
    `;
    
    const params = [];
    
    // Merchants see redemptions for their campaigns only
    if (user_role === 'merchant') {
      query += ' WHERE camp.merchant_id = ?';
      params.push(user_id);
    } 
    // Customers see only their redemptions
    else if (user_role === 'customer') {
      query += ' WHERE rl.user_id = ?';
      params.push(user_id);
    }
    // Admins see all redemptions (no WHERE clause)
    
    query += ' ORDER BY rl.id DESC LIMIT 100';
    
    const [redemptions] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: redemptions
    });
    
  } catch (err) {
    console.error('Get redemption history error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching redemption history',
      error: err.message 
    });
  }
};
