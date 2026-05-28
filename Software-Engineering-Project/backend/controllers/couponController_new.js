// EPIC 2: Coupon Generation and Security Controller
import pool from "../db.js";
import { generateUniqueCodes, encrypt } from '../utils/security.js';
import { hmacCode } from '../utils/couponGen.js';
import QRCode from 'qrcode';

/**
 * EPIC 2: Story 1 & 2 - Generate unique coupon codes for campaign
 */
export const generateCoupons = async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    const { campaign_id, count = 1, code_length = 12, prefix = '', user_id } = req.body;
    
    await conn.beginTransaction();
    
    // Verify campaign exists
    const [campaigns] = await conn.query(
      'SELECT * FROM campaigns WHERE id = ?',
      [campaign_id]
    );
    
    if (campaigns.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    const campaign = campaigns[0];
    console.log('Campaign for coupon generation:', { id: campaign.id, name: campaign.name, status: campaign.status, merchant_id: campaign.merchant_id });
    
    // EPIC 2: Story 5 - Fetch existing codes to prevent duplicates
    const [existingCodes] = await conn.query('SELECT code FROM coupons');
    const existingSet = new Set(existingCodes.map(c => c.code));
    
    // Generate unique codes
    const codes = await generateUniqueCodes(count, code_length, prefix, existingSet);
    
    // Insert coupons one by one
    const generatedCoupons = [];
    
    for (const code of codes) {
      const codeEncrypted = encrypt(code);
      const statusVal = user_id ? 'distributed' : 'generated';
      
      const [insertResult] = await conn.query(
        `INSERT INTO coupons (campaign_id, code, code_encrypted, user_id, status, expiry_date) VALUES (?, ?, ?, ?, ?, ?)`,
        [campaign_id, code, codeEncrypted, user_id || null, statusVal, campaign.end_date]
      );
      
      generatedCoupons.push({
        id: insertResult.insertId,
        code: code,
        campaign_id,
        status: statusVal
      });
    }
    
    await conn.commit();
    
    res.status(201).json({
      message: `${count} coupon(s) generated successfully`,
      count,
      campaign_id,
      coupons: generatedCoupons,
      total_generated: codes.length
    });
    
  } catch (err) {
    await conn.rollback();
    console.error('Generate coupons error:', err);
    res.status(500).json({ message: "Error generating coupons", error: err.message });
  } finally {
    conn.release();
  }
};

/**
 * Get all coupons with filtering
 */
export const getAllCoupons = async (req, res) => {
  try {
    const { campaign_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT c.*, 
        camp.name as campaign_name
      FROM coupons c
      LEFT JOIN campaigns camp ON c.campaign_id = camp.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (campaign_id) {
      query += ' AND c.campaign_id = ?';
      params.push(campaign_id);
    }
    
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    
    // Role-based filtering
    if (req.user.role === 'merchant') {
      query += ' AND camp.merchant_id = ?';
      params.push(req.user.id);
    }
    
    // Count
    const countQuery = query.replace(/SELECT c\.\*[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult ? (countResult[0]?.total || 0) : 0;
    
    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [coupons] = await pool.query(query, params);
    
    res.json({
      coupons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get coupons error:', err);
    res.status(500).json({ message: "Error fetching coupons", error: err.message });
  }
};

/**
 * Get coupon by ID or code
 */
export const getCoupon = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    let query = `
      SELECT c.*, 
        camp.name as campaign_name,
        camp.discount_type,
        camp.discount_value,
        camp.merchant_id,
        u.name as merchant_name
      FROM coupons c
      LEFT JOIN campaigns camp ON c.campaign_id = camp.id
      LEFT JOIN users u ON camp.merchant_id = u.id
      WHERE c.id = ? OR c.code = ?
    `;
    
    const [coupons] = await pool.query(query, [identifier, identifier]);
    
    if (coupons.length === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    const coupon = coupons[0];
    
    // Check access
    if (req.user.role === 'merchant' && coupon.merchant_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({ coupon });
  } catch (err) {
    console.error('Get coupon error:', err);
    res.status(500).json({ message: "Error fetching coupon", error: err.message });
  }
};

/**
 * EPIC 3: Story 3 - Generate QR code for coupon
 */
export const generateQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [coupons] = await pool.query(
      'SELECT c.*, camp.merchant_id FROM coupons c LEFT JOIN campaigns camp ON c.campaign_id = camp.id WHERE c.id = ?',
      [id]
    );
    
    if (coupons.length === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    const coupon = coupons[0];
    
    // Check access
    if (req.user.role === 'merchant' && coupon.merchant_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Generate QR code
    const qrData = {
      code: coupon.code,
      campaign_id: coupon.campaign_id,
      redemption_url: `${process.env.QR_CODE_BASE_URL}/${coupon.code}`
    };
    
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
    
    // Optionally save QR URL to database
    await pool.query(
      'UPDATE coupons SET qr_code_url = ? WHERE id = ?',
      [qrCodeDataURL, id]
    );
    
    res.json({
      coupon_code: coupon.code,
      qr_code: qrCodeDataURL
    });
  } catch (err) {
    console.error('Generate QR error:', err);
    res.status(500).json({ message: "Error generating QR code", error: err.message });
  }
};

/**
 * Assign coupon to user
 */
export const assignCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    const [result] = await pool.query(
      'UPDATE coupons SET user_id = ?, status = ?, updated_at = NOW() WHERE id = ? AND user_id IS NULL',
      [user_id, 'distributed', id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Coupon already assigned or not found' });
    }
    
    res.json({ message: 'Coupon assigned successfully' });
  } catch (err) {
    console.error('Assign coupon error:', err);
    res.status(500).json({ message: "Error assigning coupon", error: err.message });
  }
};

/**
 * EPIC 2: Story 4 - Expire coupons automatically (cron job endpoint)
 */
export const expireCoupons = async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE coupons 
       SET status = 'expired' 
       WHERE status != 'redeemed' 
       AND status != 'expired' 
       AND expiry_date < NOW()`
    );
    
    res.json({
      message: 'Expired coupons updated',
      count: result.affectedRows
    });
  } catch (err) {
    console.error('Expire coupons error:', err);
    res.status(500).json({ message: "Error expiring coupons", error: err.message });
  }
};

/**
 * Delete coupon
 */
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if coupon is used
    const [coupons] = await pool.query('SELECT is_used FROM coupons WHERE id = ?', [id]);
    
    if (coupons.length === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    if (coupons[0].is_used) {
      return res.status(400).json({ message: 'Cannot delete used coupon' });
    }
    
    await pool.query('DELETE FROM coupons WHERE id = ?', [id]);
    
    res.json({ message: 'Coupon deleted successfully' });
  } catch (err) {
    console.error('Delete coupon error:', err);
    res.status(500).json({ message: "Error deleting coupon", error: err.message });
  }
};

export default {
  generateCoupons,
  getAllCoupons,
  getCoupon,
  generateQRCode,
  assignCoupon,
  expireCoupons,
  deleteCoupon
};
