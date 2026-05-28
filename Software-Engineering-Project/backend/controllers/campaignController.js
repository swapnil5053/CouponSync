// EPIC 1: Campaign Management Controller
import pool from "../db.js";

/**
 * EPIC 1: Story 3 - Get all campaigns with filtering and pagination
 */
export const getAllCampaigns = async (req, res) => {
  try {
    const { status, merchant_id, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT c.*, u.name as merchant_name, u.email as merchant_email
      FROM campaigns c
      LEFT JOIN users u ON c.merchant_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Role-based filtering
    if (req.user.role === 'merchant') {
      query += ' AND c.merchant_id = ?';
      params.push(req.user.id);
    } else if (merchant_id) {
      query += ' AND c.merchant_id = ?';
      params.push(merchant_id);
    }
    
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    
    // Get total count
    const countQuery = query.replace(/SELECT c\.\*[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult ? (countResult[0]?.total || 0) : 0;
    
    // Add pagination
    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [campaigns] = await pool.query(query, params);
    
    res.json({
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get campaigns error:', err);
    res.status(500).json({ message: "Error fetching campaigns", error: err.message });
  }
};

/**
 * EPIC 1: Story 1 - Create new campaign with validation
 * VCDS-F-001: Create Coupon Campaign
 * Campaign Validation Rules
 */
export const createCampaign = async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    const {
      name,
      description,
      type,
      discount,
      start_date,
      end_date,
      max_redemptions,
      budget,
      target_audience,
      metadata
    } = req.body;
    
    // Merchant ID from authenticated user
    const merchant_id = req.user.role === 'merchant' ? req.user.id : req.body.merchant_id;
    
    if (!merchant_id) {
      return res.status(400).json({ message: 'Merchant ID is required' });
    }

    // ===== VALIDATION RULES =====
    
    // 1. Required field validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Campaign name is required' });
    }
    
    if (name.length < 3 || name.length > 255) {
      return res.status(400).json({ message: 'Campaign name must be between 3 and 255 characters' });
    }
    
    if (!type || !['percentage', 'fixed', 'bogo', 'free_shipping'].includes(type)) {
      return res.status(400).json({ message: 'Invalid discount type. Must be: percentage, fixed, bogo, or free_shipping' });
    }
    
    if (!discount || isNaN(discount) || parseFloat(discount) <= 0) {
      return res.status(400).json({ message: 'Discount value must be a positive number' });
    }
    
    // 2. Discount value validation based on type
    if (type === 'percentage') {
      if (parseFloat(discount) > 100) {
        return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
      }
      if (parseFloat(discount) < 1) {
        return res.status(400).json({ message: 'Percentage discount must be at least 1%' });
      }
    }
    
    if (type === 'fixed') {
      if (parseFloat(discount) < 0.01) {
        return res.status(400).json({ message: 'Fixed discount must be at least $0.01' });
      }
      if (parseFloat(discount) > 10000) {
        return res.status(400).json({ message: 'Fixed discount cannot exceed $10,000' });
      }
    }
    
    // 3. Date range validation
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const now = new Date();
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Allow past dates for admins but not for merchants
    if (req.user.role === 'merchant' && startDate < now) {
      return res.status(400).json({ message: 'Start date cannot be in the past' });
    }
    
    if (endDate <= startDate) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }
    
    // Campaign duration validation (minimum 1 hour, maximum 1 year)
    const durationMs = endDate - startDate;
    const oneHour = 60 * 60 * 1000;
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    
    if (durationMs < oneHour) {
      return res.status(400).json({ message: 'Campaign duration must be at least 1 hour' });
    }
    
    if (durationMs > oneYear) {
      return res.status(400).json({ message: 'Campaign duration cannot exceed 1 year' });
    }
    
    // 4. Max redemptions validation
    if (max_redemptions !== null && max_redemptions !== undefined && max_redemptions !== '') {
      const maxRedemptionsNum = parseInt(max_redemptions);
      if (isNaN(maxRedemptionsNum) || maxRedemptionsNum < 1) {
        return res.status(400).json({ message: 'Max redemptions must be a positive integer' });
      }
      if (maxRedemptionsNum > 1000000) {
        return res.status(400).json({ message: 'Max redemptions cannot exceed 1,000,000' });
      }
    }
    
    // 5. Budget validation
    if (budget !== null && budget !== undefined && budget !== '') {
      const budgetNum = parseFloat(budget);
      if (isNaN(budgetNum) || budgetNum < 0) {
        return res.status(400).json({ message: 'Budget must be a non-negative number' });
      }
      if (budgetNum > 10000000) {
        return res.status(400).json({ message: 'Budget cannot exceed $10,000,000' });
      }
    }
    
    // 6. Check for duplicate campaign names for the same merchant
    const [duplicateCheck] = await conn.query(
      'SELECT id FROM campaigns WHERE merchant_id = ? AND name = ? AND status != ?',
      [merchant_id, name.trim(), 'expired']
    );
    
    if (duplicateCheck.length > 0) {
      return res.status(400).json({ message: 'A campaign with this name already exists. Please use a different name.' });
    }
    
    // Determine initial status based on dates
    let status = 'draft';
    
    if (startDate > now) {
      status = 'scheduled';
    } else if (startDate <= now && endDate > now) {
      status = 'active';
    } else if (endDate <= now) {
      status = 'expired';
    }
    
    const [result] = await conn.query(
      `INSERT INTO campaigns 
      (merchant_id, name, description, type, discount, discount_type, discount_value, start_date, end_date, 
       max_redemptions, budget, status, target_audience, metadata) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        merchant_id,
        name.trim(),
        description?.trim() || null,
        type,
        parseFloat(discount),
        type, // discount_type
        parseFloat(discount), // discount_value
        start_date,
        end_date,
        max_redemptions ? parseInt(max_redemptions) : null,
        budget ? parseFloat(budget) : null,
        status,
        target_audience ? JSON.stringify(target_audience) : null,
        metadata ? JSON.stringify(metadata) : null
      ]
    );
    
    await conn.commit();
    
    // Fetch created campaign
    const [campaigns] = await conn.query('SELECT * FROM campaigns WHERE id = ?', [result.insertId]);
    
    res.status(201).json({
      message: "Campaign created successfully",
      campaign: campaigns[0]
    });
  } catch (err) {
    await conn.rollback();
    console.error('Create campaign error:', err);
    res.status(500).json({ message: "Error creating campaign", error: err.message });
  } finally {
    conn.release();
  }
};

/**
 * EPIC 1: Story 3 - Get single campaign by ID
 */
export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [campaigns] = await pool.query(
      `SELECT c.*, u.name as merchant_name, u.email as merchant_email,
        (SELECT COUNT(*) FROM coupons WHERE campaign_id = c.id) as total_coupons,
        (SELECT COUNT(*) FROM coupons WHERE campaign_id = c.id AND status = 'redeemed') as used_coupons,
        (SELECT COUNT(*) FROM coupons WHERE campaign_id = c.id AND status = 'available') as active_coupons
      FROM campaigns c
      LEFT JOIN users u ON c.merchant_id = u.id
      WHERE c.id = ?`,
      [id]
    );
    
    if (campaigns.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    const campaign = campaigns[0];
    
    // Check access rights
    if (req.user.role === 'merchant' && campaign.merchant_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied to this campaign' });
    }
    
    res.json({ campaign });
  } catch (err) {
    console.error('Get campaign error:', err);
    res.status(500).json({ message: "Error fetching campaign", error: err.message });
  }
};

/**
 * EPIC 1: Story 2 - Update campaign (Manage Active Campaigns)
 * Allows merchants to edit or deactivate ongoing campaigns
 */
export const updateCampaign = async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    const { id } = req.params;
    
    // Check if campaign exists and user has access
    const [existing] = await conn.query('SELECT * FROM campaigns WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    const campaign = existing[0];
    
    if (req.user.role === 'merchant' && campaign.merchant_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied to this campaign' });
    }
    
    // Prevent editing expired or completed campaigns
    if (campaign.status === 'expired' || campaign.status === 'completed') {
      return res.status(400).json({ 
        message: `Cannot edit ${campaign.status} campaigns. Campaign has already ended.` 
      });
    }
    
    await conn.beginTransaction();
    
    const {
      name,
      description,
      type,
      discount,
      start_date,
      end_date,
      max_redemptions,
      budget,
      target_audience,
      metadata
    } = req.body;
    
    // ===== VALIDATION RULES FOR UPDATES =====
    
    // Validate name if provided
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: 'Campaign name cannot be empty' });
      }
      if (name.length < 3 || name.length > 255) {
        return res.status(400).json({ message: 'Campaign name must be between 3 and 255 characters' });
      }
      
      // Check for duplicate names
      const [duplicateCheck] = await conn.query(
        'SELECT id FROM campaigns WHERE merchant_id = ? AND name = ? AND id != ? AND status != ?',
        [campaign.merchant_id, name.trim(), id, 'expired']
      );
      
      if (duplicateCheck.length > 0) {
        return res.status(400).json({ message: 'A campaign with this name already exists' });
      }
    }
    
    // Validate discount type and value if provided
    if (type !== undefined && !['percentage', 'fixed', 'bogo', 'free_shipping'].includes(type)) {
      return res.status(400).json({ message: 'Invalid discount type' });
    }
    
    if (discount !== undefined) {
      const discountNum = parseFloat(discount);
      if (isNaN(discountNum) || discountNum <= 0) {
        return res.status(400).json({ message: 'Discount value must be a positive number' });
      }
      
      const discountType = type || campaign.type;
      if (discountType === 'percentage' && discountNum > 100) {
        return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
      }
      if (discountType === 'fixed' && discountNum > 10000) {
        return res.status(400).json({ message: 'Fixed discount cannot exceed $10,000' });
      }
    }
    
    // Validate dates if provided
    if (start_date !== undefined || end_date !== undefined) {
      const newStartDate = start_date ? new Date(start_date) : new Date(campaign.start_date);
      const newEndDate = end_date ? new Date(end_date) : new Date(campaign.end_date);
      const now = new Date();
      
      if (isNaN(newStartDate.getTime()) || isNaN(newEndDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      
      // Don't allow changing start date if campaign has already started
      if (start_date && campaign.status === 'active') {
        return res.status(400).json({ 
          message: 'Cannot change start date of an active campaign' 
        });
      }
      
      if (newEndDate <= newStartDate) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
      
      // Don't allow setting end date in the past
      if (newEndDate < now) {
        return res.status(400).json({ message: 'End date cannot be in the past' });
      }
      
      const durationMs = newEndDate - newStartDate;
      const oneHour = 60 * 60 * 1000;
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      
      if (durationMs < oneHour) {
        return res.status(400).json({ message: 'Campaign duration must be at least 1 hour' });
      }
      if (durationMs > oneYear) {
        return res.status(400).json({ message: 'Campaign duration cannot exceed 1 year' });
      }
    }
    
    // Validate max_redemptions if provided
    if (max_redemptions !== undefined && max_redemptions !== null && max_redemptions !== '') {
      const maxRedNum = parseInt(max_redemptions);
      if (isNaN(maxRedNum) || maxRedNum < 1) {
        return res.status(400).json({ message: 'Max redemptions must be a positive integer' });
      }
      
      // Don't allow reducing below current redemptions
      if (maxRedNum < campaign.current_redemptions) {
        return res.status(400).json({ 
          message: `Cannot set max redemptions below current usage (${campaign.current_redemptions})` 
        });
      }
    }
    
    // Validate budget if provided
    if (budget !== undefined && budget !== null && budget !== '') {
      const budgetNum = parseFloat(budget);
      if (isNaN(budgetNum) || budgetNum < 0) {
        return res.status(400).json({ message: 'Budget must be a non-negative number' });
      }
    }
    
    // Build update query
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description?.trim() || null);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      values.push(type);
      updates.push('discount_type = ?');
      values.push(type);
    }
    if (discount !== undefined) {
      updates.push('discount = ?');
      values.push(parseFloat(discount));
      updates.push('discount_value = ?');
      values.push(parseFloat(discount));
    }
    if (start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push('end_date = ?');
      values.push(end_date);
    }
    if (max_redemptions !== undefined) {
      updates.push('max_redemptions = ?');
      values.push(max_redemptions ? parseInt(max_redemptions) : null);
    }
    if (budget !== undefined) {
      updates.push('budget = ?');
      values.push(budget ? parseFloat(budget) : null);
    }
    if (target_audience !== undefined) {
      updates.push('target_audience = ?');
      values.push(target_audience ? JSON.stringify(target_audience) : null);
    }
    if (metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(metadata ? JSON.stringify(metadata) : null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    updates.push('updated_at = NOW()');
    values.push(id);
    
    await conn.query(
      `UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    await conn.commit();
    
    // Fetch updated campaign
    const [updated] = await conn.query('SELECT * FROM campaigns WHERE id = ?', [id]);
    
    res.json({
      message: 'Campaign updated successfully',
      campaign: updated[0]
    });
  } catch (err) {
    await conn.rollback();
    console.error('Update campaign error:', err);
    res.status(500).json({ message: "Error updating campaign", error: err.message });
  } finally {
    conn.release();
  }
};

/**
 * EPIC 1: Story 4 - Activate/Deactivate campaign
 * Manage Active Campaigns - Activate/Deactivate Campaign
 */
export const updateCampaignStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['draft', 'scheduled', 'active', 'paused', 'completed', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: draft, scheduled, active, paused, completed, expired' 
      });
    }
    
    // Check access and get current campaign
    const [campaigns] = await pool.query(
      'SELECT * FROM campaigns WHERE id = ?', 
      [id]
    );
    
    if (campaigns.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    const campaign = campaigns[0];
    
    if (req.user.role === 'merchant' && campaign.merchant_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied to this campaign' });
    }
    
    // ===== STATUS TRANSITION VALIDATION =====
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);
    
    // Cannot change status of expired campaigns
    if (campaign.status === 'expired' && status !== 'expired') {
      return res.status(400).json({ 
        message: 'Cannot change status of expired campaign' 
      });
    }
    
    // Cannot change status of completed campaigns
    if (campaign.status === 'completed' && status !== 'completed') {
      return res.status(400).json({ 
        message: 'Cannot change status of completed campaign' 
      });
    }
    
    // Allow merchants full control - no date restrictions for status changes
    // Merchants can activate/pause/schedule campaigns as they wish
    if (status === 'paused' && campaign.status === 'scheduled') {
      return res.status(400).json({ 
        message: 'Cannot pause a scheduled campaign. Campaign must be active first.' 
      });
    }
    
    // Update status
    await pool.query(
      'UPDATE campaigns SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    
    res.json({ 
      message: `Campaign ${status} successfully`,
      previousStatus: campaign.status,
      newStatus: status
    });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: "Error updating campaign status", error: err.message });
  }
};

/**
 * Delete campaign
 */
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check access
    const [campaigns] = await pool.query('SELECT merchant_id FROM campaigns WHERE id = ?', [id]);
    
    if (campaigns.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (req.user.role === 'merchant' && campaigns[0].merchant_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await pool.query('DELETE FROM campaigns WHERE id = ?', [id]);
    
    res.json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    console.error('Delete campaign error:', err);
    res.status(500).json({ message: "Error deleting campaign", error: err.message });
  }
};

/**
 * Get campaign statistics
 */
export const getCampaignStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [stats] = await pool.query(
      `SELECT 
        c.id,
        c.name,
        c.status,
        c.total_coupons_generated,
        c.total_redemptions,
        c.max_redemptions,
        COUNT(DISTINCT cp.id) as coupons_count,
        COUNT(DISTINCT CASE WHEN cp.is_used = TRUE THEN cp.id END) as redeemed_count,
        COUNT(DISTINCT CASE WHEN cp.status = 'active' THEN cp.id END) as active_count,
        COUNT(DISTINCT CASE WHEN cp.status = 'expired' THEN cp.id END) as expired_count,
        COUNT(DISTINCT rl.id) as total_redemption_attempts,
        COUNT(DISTINCT CASE WHEN rl.redemption_status = 'success' THEN rl.id END) as successful_redemptions,
        COUNT(DISTINCT CASE WHEN rl.redemption_status = 'failed' THEN rl.id END) as failed_redemptions
      FROM campaigns c
      LEFT JOIN coupons cp ON c.id = cp.campaign_id
      LEFT JOIN redemption_logs rl ON c.id = rl.campaign_id
      WHERE c.id = ?
      GROUP BY c.id`,
      [id]
    );
    
    if (stats.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    res.json({ stats: stats[0] });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ message: "Error fetching campaign statistics", error: err.message });
  }
};

export default {
  getAllCampaigns,
  createCampaign,
  getCampaignById,
  updateCampaign,
  updateCampaignStatus,
  deleteCampaign,
  getCampaignStats
};
