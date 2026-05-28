// Simple Reports Controller
import pool from "../db.js";

/**
 * Get dashboard analytics - simple version
 */
export const getDashboardAnalytics = async (req, res) => {
  try {
    const merchant_id = req.user.role === 'merchant' ? req.user.id : null;
    const is_admin = req.user.role === 'admin';
    
    console.log('Dashboard request - User:', req.user.id, 'Role:', req.user.role, 'Merchant ID:', merchant_id);
    
    // Get campaign counts
    let campaignQuery = `
      SELECT 
        COUNT(*) as total_campaigns,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_campaigns,
        COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_campaigns,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_campaigns
      FROM campaigns
    `;
    
    const params = [];
    if (merchant_id) {
      campaignQuery += ' WHERE merchant_id = ?';
      params.push(merchant_id);
    }
    
    console.log('Campaign query:', campaignQuery, 'Params:', params);
    const [campaignStats] = await pool.query(campaignQuery, params);
    console.log('Campaign stats:', campaignStats);
    console.log('Campaign stats:', campaignStats);
    
    // Get coupon counts
    let couponQuery = `
      SELECT 
        COUNT(*) as total_coupons,
        COUNT(CASE WHEN status = 'assigned' THEN 1 END) as distributed_coupons,
        COUNT(CASE WHEN status = 'redeemed' THEN 1 END) as redeemed_coupons,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_coupons
      FROM coupons
    `;
    
    if (merchant_id) {
      couponQuery += ` WHERE campaign_id IN (SELECT id FROM campaigns WHERE merchant_id = ?)`;
      console.log('Coupon query (merchant):', couponQuery);
      const [couponStats] = await pool.query(couponQuery, [merchant_id]);
      console.log('Coupon stats:', couponStats);
      
      res.json({
        success: true,
        stats: {
          total_campaigns: campaignStats[0].total_campaigns || 0,
          active_campaigns: campaignStats[0].active_campaigns || 0,
          paused_campaigns: campaignStats[0].paused_campaigns || 0,
          completed_campaigns: campaignStats[0].completed_campaigns || 0,
          total_coupons: couponStats[0].total_coupons || 0,
          distributed_coupons: couponStats[0].distributed_coupons || 0,
          redeemed_coupons: couponStats[0].redeemed_coupons || 0,
          expired_coupons: couponStats[0].expired_coupons || 0
        }
      });
    } else {
      // Admin or general stats
      const [couponStats] = await pool.query(couponQuery);
      
      // Get user counts for admin
      let userStats = { total_users: 0, merchants: 0, customers: 0 };
      if (is_admin) {
        const [users] = await pool.query(`
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN role = 'merchant' THEN 1 END) as merchants,
            COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers
          FROM users
        `);
        userStats = users[0];
      }
      
      res.json({
        success: true,
        stats: {
          total_campaigns: campaignStats[0].total_campaigns || 0,
          active_campaigns: campaignStats[0].active_campaigns || 0,
          paused_campaigns: campaignStats[0].paused_campaigns || 0,
          completed_campaigns: campaignStats[0].completed_campaigns || 0,
          total_coupons: couponStats[0].total_coupons || 0,
          distributed_coupons: couponStats[0].distributed_coupons || 0,
          redeemed_coupons: couponStats[0].redeemed_coupons || 0,
          expired_coupons: couponStats[0].expired_coupons || 0,
          total_users: userStats.total_users || 0,
          merchants: userStats.merchants || 0,
          customers: userStats.customers || 0
        }
      });
    }
    
  } catch (err) {
    console.error('Get dashboard analytics error:', err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching dashboard data", 
      error: err.message 
    });
  }
};

/**
 * Get customer stats
 */
export const getCustomerStats = async (req, res) => {
  try {
    const user_id = req.user.id;
    
    // Get all coupons for customer stats (since we don't have user_id in coupons table)
    // This is a simplified version - just show overall stats
    const [couponStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_coupons,
        COUNT(CASE WHEN status = 'assigned' THEN 1 END) as available_coupons,
        COUNT(CASE WHEN status = 'redeemed' THEN 1 END) as redeemed_coupons
      FROM coupons
    `);
    
    // Get active campaigns count
    const [campaignStats] = await pool.query(`
      SELECT COUNT(*) as active_offers
      FROM campaigns
      WHERE status = 'active' AND NOW() BETWEEN start_date AND end_date
    `);
    
    res.json({
      success: true,
      total_coupons: couponStats[0].total_coupons || 0,
      available_coupons: couponStats[0].available_coupons || 0,
      redeemed_coupons: couponStats[0].redeemed_coupons || 0,
      active_offers: campaignStats[0].active_offers || 0,
      total_savings: 0
    });
    
  } catch (err) {
    console.error('Get customer stats error:', err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching customer stats", 
      error: err.message 
    });
  }
};

/**
 * Get merchant reports
 */
export const getMerchantReports = async (req, res) => {
  try {
    const merchant_id = req.user.role === 'merchant' ? req.user.id : req.query.merchant_id;
    
    const [campaigns] = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.status,
        c.type as discount_type,
        c.discount as discount_value,
        c.start_date,
        c.end_date,
        COUNT(DISTINCT cp.id) as total_coupons,
        COUNT(DISTINCT CASE WHEN cp.status = 'redeemed' THEN cp.id END) as redeemed_coupons
      FROM campaigns c
      LEFT JOIN coupons cp ON c.id = cp.campaign_id
      WHERE c.merchant_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `, [merchant_id]);
    
    res.json({ 
      success: true,
      reports: campaigns 
    });
    
  } catch (err) {
    console.error('Get merchant reports error:', err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching reports", 
      error: err.message 
    });
  }
};

/**
 * Get campaign metrics
 */
export const getCampaignMetrics = async (req, res) => {
  try {
    const campaign_id = req.params.id;
    
    const [metrics] = await pool.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT cp.id) as total_coupons,
        COUNT(DISTINCT CASE WHEN cp.status = 'distributed' THEN cp.id END) as distributed_coupons,
        COUNT(DISTINCT CASE WHEN cp.status = 'redeemed' THEN cp.id END) as redeemed_coupons
      FROM campaigns c
      LEFT JOIN coupons cp ON c.id = cp.campaign_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [campaign_id]);
    
    if (metrics.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    res.json({ 
      success: true,
      metrics: metrics[0] 
    });
    
  } catch (err) {
    console.error('Get campaign metrics error:', err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching campaign metrics", 
      error: err.message 
    });
  }
};

/**
 * Get system stats (admin only)
 */
export const getSystemStats = async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM campaigns) as total_campaigns,
        (SELECT COUNT(*) FROM coupons) as total_coupons,
        (SELECT COUNT(*) FROM coupons WHERE status = 'redeemed') as total_redemptions
    `);
    
    res.json({ 
      success: true,
      stats: stats[0] 
    });
    
  } catch (err) {
    console.error('Get system stats error:', err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching system stats", 
      error: err.message 
    });
  }
};

export const exportReportCSV = async (req, res) => {
  res.status(501).json({ message: "CSV export not implemented yet" });
};
