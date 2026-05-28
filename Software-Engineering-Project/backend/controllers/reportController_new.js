// EPIC 5: Reporting and Analytics Controller
import pool from "../db.js";

/**
 * EPIC 5: Story 1 - Generate merchant campaign reports
 */
export const getMerchantReports = async (req, res) => {
  try {
    const { campaign_id, start_date, end_date } = req.query;
    const merchant_id = req.user.role === 'merchant' ? req.user.id : req.query.merchant_id;
    
    let query = `
      SELECT 
        c.id as campaign_id,
        c.name as campaign_name,
        c.status,
        c.discount_type,
        c.discount_value,
        c.start_date,
        c.end_date,
        c.total_coupons_generated,
        c.total_redemptions,
        c.max_redemptions,
        COUNT(DISTINCT cp.id) as total_coupons,
        COUNT(DISTINCT CASE WHEN cp.status = 'active' THEN cp.id END) as active_coupons,
        COUNT(DISTINCT CASE WHEN cp.is_used = TRUE THEN cp.id END) as redeemed_coupons,
        COUNT(DISTINCT CASE WHEN cp.status = 'expired' THEN cp.id END) as expired_coupons,
        COUNT(DISTINCT rl.id) as total_attempts,
        COUNT(DISTINCT CASE WHEN rl.redemption_status = 'success' THEN rl.id END) as successful_redemptions,
        COUNT(DISTINCT CASE WHEN rl.redemption_status = 'failed' THEN rl.id END) as failed_attempts,
        SUM(CASE WHEN rl.redemption_status = 'success' THEN rl.discount_applied ELSE 0 END) as total_discount_given,
        ROUND((COUNT(DISTINCT CASE WHEN cp.is_used = TRUE THEN cp.id END) / NULLIF(COUNT(DISTINCT cp.id), 0)) * 100, 2) as redemption_rate
      FROM campaigns c
      LEFT JOIN coupons cp ON c.id = cp.campaign_id
      LEFT JOIN redemption_logs rl ON c.id = rl.campaign_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (merchant_id) {
      query += ' AND c.merchant_id = ?';
      params.push(merchant_id);
    }
    
    if (campaign_id) {
      query += ' AND c.id = ?';
      params.push(campaign_id);
    }
    
    if (start_date) {
      query += ' AND c.start_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND c.end_date <= ?';
      params.push(end_date);
    }
    
    query += ' GROUP BY c.id ORDER BY c.created_at DESC';
    
    const [reports] = await pool.query(query, params);
    
    res.json({ reports });
  } catch (err) {
    console.error('Get merchant reports error:', err);
    res.status(500).json({ message: "Error fetching merchant reports", error: err.message });
  }
};

/**
 * EPIC 5: Story 2 - Get analytics dashboard data
 */
export const getDashboardAnalytics = async (req, res) => {
  try {
    const merchant_id = req.user.role === 'merchant' ? req.user.id : null;
    
    // Overall statistics
    let statsQuery = `
      SELECT 
        COUNT(DISTINCT c.id) as total_campaigns,
        COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_campaigns,
        SUM(c.total_coupons_generated) as total_coupons_generated,
        SUM(c.total_redemptions) as total_redemptions,
        COUNT(DISTINCT rl.id) as total_attempts,
        COUNT(DISTINCT CASE WHEN rl.redemption_status = 'success' THEN rl.id END) as successful_redemptions,
        SUM(CASE WHEN rl.redemption_status = 'success' THEN rl.discount_applied ELSE 0 END) as total_discount_value
      FROM campaigns c
      LEFT JOIN redemption_logs rl ON c.id = rl.campaign_id
    `;
    
    const params = [];
    if (merchant_id) {
      statsQuery += ' WHERE c.merchant_id = ?';
      params.push(merchant_id);
    }
    
    const [stats] = await pool.query(statsQuery, params);
    
    // Recent redemptions
    let recentQuery = `
      SELECT rl.*, c.code, camp.name as campaign_name, u.name as user_name
      FROM redemption_logs rl
      LEFT JOIN coupons c ON rl.coupon_id = c.id
      LEFT JOIN campaigns camp ON rl.campaign_id = camp.id
      LEFT JOIN users u ON rl.user_id = u.id
    `;
    
    if (merchant_id) {
      recentQuery += ' WHERE camp.merchant_id = ?';
    }
    
    recentQuery += ' ORDER BY rl.redeemed_at DESC LIMIT 10';
    
    const [recentRedemptions] = merchant_id 
      ? await pool.query(recentQuery, [merchant_id])
      : await pool.query(recentQuery);
    
    // Redemptions by day (last 30 days)
    let dailyQuery = `
      SELECT 
        DATE(rl.redeemed_at) as date,
        COUNT(CASE WHEN rl.redemption_status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN rl.redemption_status = 'failed' THEN 1 END) as failed
      FROM redemption_logs rl
      LEFT JOIN campaigns c ON rl.campaign_id = c.id
      WHERE rl.redeemed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    
    if (merchant_id) {
      dailyQuery += ' AND c.merchant_id = ?';
    }
    
    dailyQuery += ' GROUP BY DATE(rl.redeemed_at) ORDER BY date DESC';
    
    const [dailyStats] = merchant_id
      ? await pool.query(dailyQuery, [merchant_id])
      : await pool.query(dailyQuery);
    
    // Top performing campaigns
    let topQuery = `
      SELECT 
        c.id,
        c.name,
        c.status,
        COUNT(DISTINCT cp.id) as total_coupons,
        COUNT(DISTINCT CASE WHEN cp.is_used = TRUE THEN cp.id END) as redeemed,
        ROUND((COUNT(DISTINCT CASE WHEN cp.is_used = TRUE THEN cp.id END) / NULLIF(COUNT(DISTINCT cp.id), 0)) * 100, 2) as redemption_rate
      FROM campaigns c
      LEFT JOIN coupons cp ON c.id = cp.campaign_id
    `;
    
    if (merchant_id) {
      topQuery += ' WHERE c.merchant_id = ?';
    }
    
    topQuery += ' GROUP BY c.id ORDER BY redemption_rate DESC LIMIT 5';
    
    const [topCampaigns] = merchant_id
      ? await pool.query(topQuery, [merchant_id])
      : await pool.query(topQuery);
    
    res.json({
      statistics: stats[0],
      recentRedemptions,
      dailyStats,
      topCampaigns
    });
  } catch (err) {
    console.error('Get dashboard analytics error:', err);
    res.status(500).json({ message: "Error fetching dashboard analytics", error: err.message });
  }
};

/**
 * EPIC 5: Story 5 - Export report as CSV
 */
export const exportReportCSV = async (req, res) => {
  try {
    const { campaign_id } = req.query;
    const merchant_id = req.user.role === 'merchant' ? req.user.id : null;
    
    let query = `
      SELECT 
        c.code as 'Coupon Code',
        camp.name as 'Campaign Name',
        c.status as 'Status',
        c.is_used as 'Is Used',
        c.created_at as 'Created At',
        c.redeemed_at as 'Redeemed At',
        u.name as 'Redeemed By',
        c.expiry_date as 'Expiry Date'
      FROM coupons c
      LEFT JOIN campaigns camp ON c.campaign_id = camp.id
      LEFT JOIN users u ON c.redeemed_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (merchant_id) {
      query += ' AND camp.merchant_id = ?';
      params.push(merchant_id);
    }
    
    if (campaign_id) {
      query += ' AND c.campaign_id = ?';
      params.push(campaign_id);
    }
    
    const [data] = await pool.query(query, params);
    
    if (data.length === 0) {
      return res.status(404).json({ message: 'No data to export' });
    }
    
    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return value === null ? '' : `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="coupon_report_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ message: "Error exporting report", error: err.message });
  }
};

/**
 * Get campaign performance metrics
 */
export const getCampaignMetrics = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [metrics] = await pool.query(
      `SELECT 
        c.id,
        c.name,
        c.status,
        c.total_coupons_generated,
        c.total_redemptions,
        COUNT(DISTINCT cp.id) as coupon_count,
        COUNT(DISTINCT CASE WHEN cp.is_used = TRUE THEN cp.id END) as used_count,
        COUNT(DISTINCT rl.id) as total_attempts,
        COUNT(DISTINCT CASE WHEN rl.redemption_status = 'success' THEN rl.id END) as successful,
        COUNT(DISTINCT CASE WHEN rl.redemption_status = 'failed' THEN rl.id END) as failed,
        COUNT(DISTINCT CASE WHEN rl.redemption_status = 'duplicate' THEN rl.id END) as duplicate_attempts,
        SUM(CASE WHEN rl.redemption_status = 'success' THEN rl.discount_applied ELSE 0 END) as total_discount,
        AVG(CASE WHEN rl.redemption_status = 'success' THEN rl.discount_applied END) as avg_discount,
        ROUND((COUNT(DISTINCT CASE WHEN cp.is_used = TRUE THEN cp.id END) / NULLIF(COUNT(DISTINCT cp.id), 0)) * 100, 2) as redemption_rate,
        COUNT(DISTINCT dl.id) as distribution_count,
        COUNT(DISTINCT CASE WHEN dl.status = 'delivered' THEN dl.id END) as delivered_count
      FROM campaigns c
      LEFT JOIN coupons cp ON c.id = cp.campaign_id
      LEFT JOIN redemption_logs rl ON c.id = rl.campaign_id
      LEFT JOIN distribution_logs dl ON cp.id = dl.coupon_id
      WHERE c.id = ?
      GROUP BY c.id`,
      [id]
    );
    
    if (metrics.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    res.json({ metrics: metrics[0] });
  } catch (err) {
    console.error('Get campaign metrics error:', err);
    res.status(500).json({ message: "Error fetching campaign metrics", error: err.message });
  }
};

/**
 * Get system-wide statistics (Admin only)
 */
export const getSystemStats = async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'merchant') as total_merchants,
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
        (SELECT COUNT(*) FROM campaigns) as total_campaigns,
        (SELECT COUNT(*) FROM campaigns WHERE status = 'active') as active_campaigns,
        (SELECT SUM(total_coupons_generated) FROM campaigns) as total_coupons,
        (SELECT SUM(total_redemptions) FROM campaigns) as total_redemptions,
        (SELECT COUNT(*) FROM redemption_logs WHERE redemption_status = 'success') as successful_redemptions,
        (SELECT COUNT(*) FROM fraud_attempts) as fraud_attempts,
        (SELECT SUM(discount_applied) FROM redemption_logs WHERE redemption_status = 'success') as total_discount_value
    `);
    
    res.json({ stats: stats[0] });
  } catch (err) {
    console.error('Get system stats error:', err);
    res.status(500).json({ message: "Error fetching system statistics", error: err.message });
  }
};

/**
 * Get customer dashboard statistics
 * Returns customer-specific metrics: total coupons, available coupons, redeemed, savings, and active offers
 */
export const getCustomerStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get customer's coupon statistics
    const [couponStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_coupons,
        COUNT(CASE WHEN status IN ('generated', 'distributed', 'active') AND expiry_date > NOW() THEN 1 END) as available_coupons,
        COUNT(CASE WHEN status = 'redeemed' THEN 1 END) as redeemed_coupons
      FROM coupons
      WHERE user_id = ?
    `, [userId]);
    
    // Get total savings (sum of discounts from successful redemptions)
    const [savingsData] = await pool.query(`
      SELECT 
        COALESCE(SUM(discount_applied), 0) as total_savings
      FROM redemption_logs
      WHERE user_id = ? AND redemption_status = 'success'
    `, [userId]);
    
    // Get active offers (available coupons from active campaigns)
    const [activeOffersData] = await pool.query(`
      SELECT COUNT(*) as active_offers
      FROM coupons c
      INNER JOIN campaigns camp ON c.campaign_id = camp.id
      WHERE c.user_id = ? 
        AND c.status IN ('generated', 'distributed', 'active')
        AND c.expiry_date > NOW()
        AND camp.status = 'active'
        AND camp.start_date <= NOW()
        AND camp.end_date >= NOW()
    `, [userId]);
    
    res.json({
      customer_stats: {
        total_coupons: couponStats[0].total_coupons || 0,
        available_coupons: couponStats[0].available_coupons || 0,
        redeemed_coupons: couponStats[0].redeemed_coupons || 0,
        total_savings: parseFloat(savingsData[0].total_savings) || 0,
        active_offers: activeOffersData[0].active_offers || 0
      }
    });
  } catch (err) {
    console.error('Get customer stats error:', err);
    res.status(500).json({ message: "Error fetching customer statistics", error: err.message });
  }
};

export default {
  getMerchantReports,
  getDashboardAnalytics,
  exportReportCSV,
  getCampaignMetrics,
  getSystemStats,
  getCustomerStats
};
