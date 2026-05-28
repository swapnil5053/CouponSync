// backend/controllers/couponController.js
import pool from '../db.js';
import { generateUniqueCodeAndInsert, hmacCode } from '../utils/couponGen.js';

/**
 * POST /api/coupons/generate
 * body: { campaignId, count = 1, channel = 'email', recipients = [], prefix = '', expiresAt }
 */
export const generateCoupons = async (req, res) => {
  try {
    const { campaignId, count = 1, channel = 'email', recipients = [], prefix = '', expiresAt = null } = req.body;

    if (!campaignId || count <= 0) return res.status(400).json({ message: 'campaignId and count required' });

    const created = [];

    for (let i = 0; i < count; i++) {
      const { id, code } = await generateUniqueCodeAndInsert(pool, { campaignId, prefix, expiresAt });
      created.push({ id, code });

      // create delivery_attempts row for tracking (attempts start at 0/pending)
      const dest = recipients[i] || null;
      await pool.query(
        `INSERT INTO delivery_attempts (coupon_id, channel, destination, attempt, status) VALUES (?, ?, ?, 0, 'pending')`,
        [id, channel, dest]
      );

      // Optionally: call email/sms send here or enqueue for background worker
      // For now we will leave as pending so a separate process can send and update status.
    }

    res.json({ createdCount: created.length, coupons: created });
  } catch (err) {
    console.error('generateCoupons error:', err);
    res.status(500).json({ message: 'Failed to generate coupons', error: err.message });
  }
};


/**
 * POST /api/coupons/redeem
 * body: { code, userIdentifier }
 *
 * This uses a single conditional UPDATE to atomically mark coupon redeemed.
 */
export const redeemCoupon = async (req, res) => {
  try {
    const { code, userIdentifier } = req.body;
    if (!code) return res.status(400).json({ message: 'code required' });

    const codeHash = hmacCode(code);

    // Atomic update: set redeemed = 1 if not redeemed and not expired
    const [updateResult] = await pool.query(
      `UPDATE coupons
       SET redeemed = 1, redeemed_at = NOW()
       WHERE code_hash = ? AND redeemed = 0 AND (expires_at IS NULL OR expires_at > NOW())`,
      [codeHash]
    );

    if (!updateResult || updateResult.affectedRows === 0) {
      // Log failed redemption for audit
      await pool.query(
        `INSERT INTO redemptions (coupon_id, campaign_id, user_identifier, ip, user_agent, success)
         VALUES (NULL, NULL, ?, ?, ?, FALSE)`,
        [userIdentifier || 'anonymous', req.ip, req.get('User-Agent')]
      );
      return res.status(400).json({ message: 'Invalid, expired, or already redeemed coupon' });
    }

    // On success, fetch coupon id and campaign_id (the coupon now redeemed)
    const [rows] = await pool.query('SELECT id, campaign_id FROM coupons WHERE code_hash = ?', [codeHash]);
    const couponId = rows?.[0]?.id ?? null;
    const campaignId = rows?.[0]?.campaign_id ?? null;

    // Insert a successful redemption log
    await pool.query(
      `INSERT INTO redemptions (coupon_id, campaign_id, user_identifier, ip, user_agent, success)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [couponId, campaignId, userIdentifier || 'anonymous', req.ip, req.get('User-Agent')]
    );

    res.json({ message: 'Coupon redeemed', couponId, campaignId });
  } catch (err) {
    console.error('redeemCoupon error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


/**
 * GET /api/coupons
 * optional query: ?campaignId=...&assigned_to=userId
 */
export const getCoupons = async (req, res) => {
  try {
    const { campaignId, assigned_to } = req.query;
    
    let q = `SELECT c.id, c.code, c.campaign_id, c.assigned_to, c.status, c.expires_at, c.created_at,
             camp.name as campaign_name, camp.type as campaign_type, camp.discount as campaign_discount
             FROM coupons c
             LEFT JOIN campaigns camp ON c.campaign_id = camp.id`;
    
    const params = [];
    const conditions = [];
    
    if (campaignId) {
      conditions.push('c.campaign_id = ?');
      params.push(campaignId);
    }
    
    if (assigned_to) {
      conditions.push('c.assigned_to = ?');
      params.push(assigned_to);
    }
    
    if (conditions.length > 0) {
      q += ' WHERE ' + conditions.join(' AND ');
    }
    
    q += ' ORDER BY c.created_at DESC LIMIT 1000';
    const [rows] = await pool.query(q, params);
    
    res.json({ coupons: rows, total: rows.length });
  } catch (err) {
    console.error('getCoupons error:', err);
    res.status(500).json({ message: 'Error fetching coupons' });
  }
};
