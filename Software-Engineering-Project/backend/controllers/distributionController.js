// EPIC 3: Distribution Controller
import pool from "../db.js";
import { distributeViaEmail, distributeViaSMS, retryFailedDistributions, getDistributionStats } from '../services/distributionService.js';

/**
 * EPIC 3: Story 1 - Distribute coupons via email
 */
export const distributeCouponsEmail = async (req, res) => {
  try {
    const { campaign_id, recipients } = req.body;
    
    // Verify campaign and get details
    const [campaigns] = await pool.query('SELECT * FROM campaigns WHERE id = ?', [campaign_id]);
    
    if (campaigns.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    const campaign = campaigns[0];
    
    // Check access
    if (req.user.role === 'merchant' && campaign.merchant_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get available coupons for this campaign
    const [coupons] = await pool.query(
      'SELECT * FROM coupons WHERE campaign_id = ? AND user_id IS NULL AND status = ? LIMIT ?',
      [campaign_id, 'generated', recipients.length]
    );
    
    if (coupons.length < recipients.length) {
      return res.status(400).json({ 
        message: `Not enough available coupons. Need ${recipients.length}, have ${coupons.length}` 
      });
    }
    
    // Distribute via email
    const results = await distributeViaEmail(recipients, coupons, campaign);
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    res.json({
      message: `Distribution completed: ${successCount} successful, ${failedCount} failed`,
      results,
      stats: {
        total: results.length,
        successful: successCount,
        failed: failedCount
      }
    });
  } catch (err) {
    console.error('Email distribution error:', err);
    res.status(500).json({ message: "Error distributing coupons via email", error: err.message });
  }
};

/**
 * EPIC 3: Story 2 - Distribute coupons via SMS
 */
export const distributeCouponsSMS = async (req, res) => {
  try {
    const { campaign_id, recipients } = req.body;
    
    // Verify campaign and get details
    const [campaigns] = await pool.query('SELECT * FROM campaigns WHERE id = ?', [campaign_id]);
    
    if (campaigns.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    const campaign = campaigns[0];
    
    // Check access
    if (req.user.role === 'merchant' && campaign.merchant_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get available coupons
    const [coupons] = await pool.query(
      'SELECT * FROM coupons WHERE campaign_id = ? AND user_id IS NULL AND status = ? LIMIT ?',
      [campaign_id, 'generated', recipients.length]
    );
    
    if (coupons.length < recipients.length) {
      return res.status(400).json({ 
        message: `Not enough available coupons. Need ${recipients.length}, have ${coupons.length}` 
      });
    }
    
    // Distribute via SMS
    const results = await distributeViaSMS(recipients, coupons, campaign);
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    res.json({
      message: `Distribution completed: ${successCount} successful, ${failedCount} failed`,
      results,
      stats: {
        total: results.length,
        successful: successCount,
        failed: failedCount
      }
    });
  } catch (err) {
    console.error('SMS distribution error:', err);
    res.status(500).json({ message: "Error distributing coupons via SMS", error: err.message });
  }
};

/**
 * EPIC 3: Story 4 - Retry failed distributions
 */
export const retryDistributions = async (req, res) => {
  try {
    const results = await retryFailedDistributions();
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    res.json({
      message: `Retry completed: ${successCount} successful, ${failedCount} failed`,
      results,
      stats: {
        total: results.length,
        successful: successCount,
        failed: failedCount
      }
    });
  } catch (err) {
    console.error('Retry distributions error:', err);
    res.status(500).json({ message: "Error retrying distributions", error: err.message });
  }
};

/**
 * Get distribution logs
 */
export const getDistributionLogs = async (req, res) => {
  try {
    const { campaign_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT dl.*, c.code as coupon_code, camp.name as campaign_name
      FROM distribution_logs dl
      LEFT JOIN coupons c ON dl.coupon_id = c.id
      LEFT JOIN campaigns camp ON c.campaign_id = camp.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Role-based filtering
    if (req.user.role === 'merchant') {
      query += ' AND camp.merchant_id = ?';
      params.push(req.user.id);
    }
    
    if (campaign_id) {
      query += ' AND c.campaign_id = ?';
      params.push(campaign_id);
    }
    
    if (status) {
      query += ' AND dl.status = ?';
      params.push(status);
    }
    
    // Count
    const countQuery = query.replace(/SELECT dl\.\*[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult ? (countResult[0]?.total || 0) : 0;
    
    query += ' ORDER BY dl.created_at DESC LIMIT ? OFFSET ?';
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
    console.error('Get distribution logs error:', err);
    res.status(500).json({ message: "Error fetching distribution logs", error: err.message });
  }
};

/**
 * Get distribution statistics for a campaign
 */
export const getCampaignDistributionStats = async (req, res) => {
  try {
    const { campaign_id } = req.params;
    
    // Check access
    const [campaigns] = await pool.query('SELECT merchant_id FROM campaigns WHERE id = ?', [campaign_id]);
    
    if (campaigns.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (req.user.role === 'merchant' && campaigns[0].merchant_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const stats = await getDistributionStats(campaign_id);
    
    res.json({ stats });
  } catch (err) {
    console.error('Get distribution stats error:', err);
    res.status(500).json({ message: "Error fetching distribution statistics", error: err.message });
  }
};

export default {
  distributeCouponsEmail,
  distributeCouponsSMS,
  retryDistributions,
  getDistributionLogs,
  getCampaignDistributionStats
};
