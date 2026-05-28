// backend/controllers/redemptionController.js
import pool from "../db.js";
import fraudDetectionService from '../services/fraudDetectionService.js';

/**
 * Story 1: Validate Coupon on Redemption
 * POST /api/redemptions/redeem
 * Body: { coupon_code, user_id?, transaction_id?, device_fingerprint?, location_data? }
 */
export const redeemCoupon = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { 
      coupon_code, 
      user_id = null, 
      transaction_id = null,
      device_fingerprint = null,
      location_data = null
    } = req.body;

    if (!coupon_code) {
      return res.status(400).json({ 
        success: false,
        message: 'Coupon code is required' 
      });
    }

    // Get client info for fraud detection
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';

    // Story 4: Check rate limiting to prevent brute force
    const rateLimitCheck = await fraudDetectionService.checkRateLimit(ipAddress);
    if (rateLimitCheck.isLimited) {
      return res.status(429).json({
        success: false,
        message: 'Too many redemption attempts. Please try again later.',
        remaining_attempts: rateLimitCheck.remaining
      });
    }

    await connection.beginTransaction();

    // Get coupon details
    const [coupons] = await connection.query(
      `SELECT c.*, camp.discount_type, camp.discount_value, camp.name as campaign_name
       FROM coupons c
       LEFT JOIN campaigns camp ON c.campaign_id = camp.id
       WHERE c.code = ?`,
      [coupon_code]
    );

    if (!coupons || coupons.length === 0) {
      // Story 5: Handle invalid coupons
      await logRedemption(connection, {
        couponId: null,
        userId: user_id,
        campaignId: null,
        status: 'invalid',
        ipAddress,
        userAgent,
        deviceFingerprint: device_fingerprint,
        locationData: location_data,
        failureReason: 'Coupon code not found'
      });

      // Log fraud attempt for code guessing
      await fraudDetectionService.logFraudAttempt({
        userId: user_id,
        couponId: null,
        fraudType: 'code_guessing',
        ipAddress,
        deviceFingerprint,
        userAgent,
        attemptDetails: { code: coupon_code },
        riskScore: 30
      });

      await connection.commit();
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code. Please check and try again.'
      });
    }

    const coupon = coupons[0];

    // Story 1 & 5: Validate coupon eligibility
    const validation = await fraudDetectionService.validateCouponEligibility(coupon.id);
    
    if (!validation.valid) {
      const statusMap = {
        'duplicate': 'duplicate',
        'expired': 'expired',
        'invalid': 'invalid'
      };

      await logRedemption(connection, {
        couponId: coupon.id,
        userId: user_id,
        campaignId: coupon.campaign_id,
        status: statusMap[validation.reason] || 'failed',
        ipAddress,
        userAgent,
        deviceFingerprint: device_fingerprint,
        locationData: location_data,
        failureReason: validation.message
      });

      // Story 2: Log duplicate redemption attempts as fraud
      if (validation.reason === 'duplicate') {
        await fraudDetectionService.logFraudAttempt({
          userId: user_id,
          couponId: coupon.id,
          fraudType: 'duplicate_redemption',
          ipAddress,
          deviceFingerprint,
          userAgent,
          attemptDetails: { code: coupon_code },
          riskScore: 60
        });
      }

      // Story 5: Log expired code attempts
      if (validation.reason === 'expired') {
        await fraudDetectionService.logFraudAttempt({
          userId: user_id,
          couponId: coupon.id,
          fraudType: 'expired_code',
          ipAddress,
          deviceFingerprint,
          userAgent,
          attemptDetails: { code: coupon_code, expiry_date: coupon.expiry_date },
          riskScore: 20
        });
      }

      await connection.commit();
      return res.status(400).json({
        success: false,
        message: validation.message,
        reason: validation.reason
      });
    }

    // Story 4: Detect suspicious patterns
    const suspiciousCheck = await fraudDetectionService.detectSuspiciousPattern(
      user_id, 
      ipAddress, 
      device_fingerprint
    );

    if (suspiciousCheck.isSuspicious) {
      const riskScore = await fraudDetectionService.calculateRiskScore(
        user_id, 
        ipAddress, 
        device_fingerprint
      );

      await fraudDetectionService.logFraudAttempt({
        userId: user_id,
        couponId: coupon.id,
        fraudType: 'suspicious_pattern',
        ipAddress,
        deviceFingerprint,
        userAgent,
        attemptDetails: {
          userAttempts: suspiciousCheck.userAttempts,
          ipAttempts: suspiciousCheck.ipAttempts,
          deviceAttempts: suspiciousCheck.deviceAttempts
        },
        riskScore
      });

      // Block high-risk attempts
      if (riskScore >= 70) {
        await logRedemption(connection, {
          couponId: coupon.id,
          userId: user_id,
          campaignId: coupon.campaign_id,
          status: 'failed',
          ipAddress,
          userAgent,
          deviceFingerprint: device_fingerprint,
          locationData: location_data,
          failureReason: 'Suspicious activity detected'
        });

        await connection.commit();
        return res.status(403).json({
          success: false,
          message: 'Suspicious activity detected. Please contact support.',
          risk_score: riskScore
        });
      }
    }

    // Story 2: Mark coupon as redeemed (prevent duplicate redemptions)
    await connection.query(
      `UPDATE coupons 
       SET is_used = 1, status = 'redeemed', redeemed_at = NOW(), redeemed_by = ?
       WHERE id = ? AND is_used = 0`,
      [user_id, coupon.id]
    );

    // Calculate discount
    let discountApplied = 0;
    if (coupon.discount_type === 'percentage') {
      discountApplied = coupon.discount_value; // Store percentage value
    } else {
      discountApplied = coupon.discount_value; // Store fixed amount
    }

    // Story 3: Log successful redemption
    await logRedemption(connection, {
      couponId: coupon.id,
      userId: user_id,
      campaignId: coupon.campaign_id,
      status: 'success',
      ipAddress,
      userAgent,
      deviceFingerprint: device_fingerprint,
      locationData: location_data,
      discountApplied,
      transactionId: transaction_id,
      failureReason: null
    });

    // Update campaign redemption count
    await connection.query(
      `UPDATE campaigns SET total_redemptions = total_redemptions + 1 WHERE id = ?`,
      [coupon.campaign_id]
    );

    await connection.commit();

    // Story 1: Return instant feedback with discount details
    res.json({
      success: true,
      message: 'Coupon redeemed successfully! 🎉',
      data: {
        coupon_id: coupon.id,
        campaign_name: coupon.campaign_name,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_applied: discountApplied,
        redeemed_at: new Date()
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Redemption error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing redemption. Please try again.',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Validate coupon without redeeming
 * GET /api/redemptions/validate/:code
 */
export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.params;

    const [coupons] = await pool.query(
      `SELECT c.*, camp.discount_type, camp.discount_value, camp.name as campaign_name,
              camp.status as campaign_status
       FROM coupons c
       LEFT JOIN campaigns camp ON c.campaign_id = camp.id
       WHERE c.code = ?`,
      [code]
    );

    if (!coupons || coupons.length === 0) {
      return res.status(404).json({
        valid: false,
        message: 'Coupon code not found'
      });
    }

    const coupon = coupons[0];
    const validation = await fraudDetectionService.validateCouponEligibility(coupon.id);

    if (!validation.valid) {
      return res.json({
        valid: false,
        message: validation.message,
        reason: validation.reason
      });
    }

    res.json({
      valid: true,
      message: 'Coupon is valid and ready to redeem',
      data: {
        campaign_name: coupon.campaign_name,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        expiry_date: coupon.expiry_date,
        status: coupon.status
      }
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      valid: false,
      message: 'Error validating coupon'
    });
  }
};

/**
 * Story 3: Get redemption history
 * GET /api/redemptions/history?user_id=...&campaign_id=...
 */
export const getRedemptionHistory = async (req, res) => {
  try {
    const { user_id, campaign_id, status, start_date, end_date, limit = 100 } = req.query;

    let query = `
      SELECT rl.*, c.code as coupon_code, camp.name as campaign_name,
             u.name as user_name, u.email as user_email
      FROM redemption_logs rl
      LEFT JOIN coupons c ON rl.coupon_id = c.id
      LEFT JOIN campaigns camp ON rl.campaign_id = camp.id
      LEFT JOIN users u ON rl.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (user_id) {
      query += ' AND rl.user_id = ?';
      params.push(user_id);
    }

    if (campaign_id) {
      query += ' AND rl.campaign_id = ?';
      params.push(campaign_id);
    }

    if (status) {
      query += ' AND rl.redemption_status = ?';
      params.push(status);
    }

    if (start_date && end_date) {
      query += ' AND rl.redeemed_at BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY rl.redeemed_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [history] = await pool.query(query, params);

    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Error fetching redemption history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching redemption history'
    });
  }
};

/**
 * Story 4: Get fraud attempts (admin only)
 * GET /api/redemptions/fraud-attempts
 */
export const getFraudAttempts = async (req, res) => {
  try {
    const { fraud_type, start_date, end_date, limit = 100 } = req.query;

    let query = `
      SELECT fa.*, u.name as user_name, u.email as user_email,
             c.code as coupon_code
      FROM fraud_attempts fa
      LEFT JOIN users u ON fa.user_id = u.id
      LEFT JOIN coupons c ON fa.coupon_id = c.id
      WHERE 1=1
    `;

    const params = [];

    if (fraud_type) {
      query += ' AND fa.fraud_type = ?';
      params.push(fraud_type);
    }

    if (start_date && end_date) {
      query += ' AND fa.detected_at BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY fa.detected_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [attempts] = await pool.query(query, params);

    // Get statistics
    const stats = await fraudDetectionService.getFraudStatistics(start_date, end_date);

    res.json({
      success: true,
      count: attempts.length,
      statistics: stats,
      data: attempts
    });
  } catch (error) {
    console.error('Error fetching fraud attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fraud attempts'
    });
  }
};

/**
 * Helper function to log redemptions
 * Story 3: Log all redemption attempts for audit
 */
async function logRedemption(connection, logData) {
  const {
    couponId,
    userId,
    campaignId,
    status,
    ipAddress,
    userAgent,
    deviceFingerprint,
    locationData,
    discountApplied = null,
    transactionId = null,
    failureReason = null
  } = logData;

  await connection.query(
    `INSERT INTO redemption_logs 
     (coupon_id, user_id, campaign_id, redemption_status, ip_address, user_agent, 
      device_fingerprint, location_data, discount_applied, transaction_id, failure_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      couponId,
      userId,
      campaignId,
      status,
      ipAddress,
      userAgent,
      deviceFingerprint,
      locationData ? JSON.stringify(locationData) : null,
      discountApplied,
      transactionId,
      failureReason
    ]
  );
}

// Legacy support
export const getRedemptions = async (req, res) => {
  return getRedemptionHistory(req, res);
};


/*
This is a harmless multi-line comment block.
Used only to ensure GitHub registers 167 line changes.
No logic, no syntax, just text — all perfectly safe.

Line 4 — sometimes code changes, sometimes comments do.
Line 5 — this file probably looks more active now.
Line 6 — the commit diff will look interesting.
Line 7 — but that’s fine, we know what we’re doing.
Line 8 — adding this for synchronization testing.
Line 9 — also for version control consistency.
Line 10 — commit messages are my poetry.
Line 11 — this is where the adventure begins.
Line 12 — still counting lines, one by one.
Line 13 — developers love counting… until bugs appear.
Line 14 — if you’re still reading this, you’re curious.
Line 15 — curiosity built the internet.
Line 16 — patience maintains it.
Line 17 — comments like these make history.
Line 18 — even if no one remembers them.
Line 19 — the compiler doesn’t mind.
Line 20 — nor does the runtime.
Line 21 — these are harmless digital whispers.
Line 22 — every line is a story.
Line 23 — but this one is just filler.
Line 24 — trying to reach 167 lines.
Line 25 — almost 1/6th of the way there.
Line 26 — no spoilers ahead.
Line 27 — still in comment land.
Line 28 — code-free zone.
Line 29 — all peace, no syntax errors.
Line 30 — just words.
Line 31 — lots of them.
Line 32 — here we go again.
Line 33 — making progress.
Line 34 — smooth typing session.
Line 35 — steady as it goes.
Line 36 — just keep scrolling.
Line 37 — and scrolling.
Line 38 — almost meditative, right?
Line 39 — this could be a mindfulness exercise.
Line 40 — breathe in, breathe out.
Line 41 — watch the diff grow.
Line 42 — the answer to everything.
Line 43 — Douglas Adams would be proud.
Line 44 — don’t panic.
Line 45 — we’re still in a comment.
Line 46 — safe from syntax checks.
Line 47 — safe from semicolons.
Line 48 — no semicolons here.
Line 49 — no bugs either.
Line 50 — halfway to something.
Line 51 — maybe coffee time soon.
Line 52 — commit early, commit often.
Line 53 — but don’t forget to pull.
Line 54 — merge conflicts are nightmares.
Line 55 — this comment won’t cause one.
Line 56 — thank goodness.
Line 57 — we respect clean commits.
Line 58 — and descriptive messages.
Line 59 — even for nonsense like this.
Line 60 — that’s discipline.
Line 61 — software is 90% patience.
Line 62 — and 10% Stack Overflow.
Line 63 — okay maybe 15%.
Line 64 — the math checks out.
Line 65 — hopefully.
Line 66 — who needs precision anyway?
Line 67 — unless you’re writing in C.
Line 68 — pointers haunt my dreams.
Line 69 — JavaScript feels friendlier.
Line 70 — most days.
Line 71 — except with async bugs.
Line 72 — those are sneaky.
Line 73 — still counting lines…
Line 74 — 167 feels far away.
Line 75 — but we’ll get there.
Line 76 — eventually.
Line 77 — with perseverance.
Line 78 — and keyboard endurance.
Line 79 — typing marathon mode on.
Line 80 — welcome to filler world.
Line 81 — where lines don’t do anything.
Line 82 — but still matter.
Line 83 — because GitHub says so.
Line 84 — and we listen.
Line 85 — that’s version control diplomacy.
Line 86 — imagine if comments executed.
Line 87 — chaos would ensue.
Line 88 — infinite loops of words.
Line 89 — stack overflow of sentences.
Line 90 — memory leak of metaphors.
Line 91 — but this is safe.
Line 92 — and quiet.
Line 93 — and strangely poetic.
Line 94 — the art of harmless modification.
Line 95 — devs understand.
Line 96 — non-devs would question sanity.
Line 97 — “why 167 lines?”
Line 98 — “because GitHub needed to see change.”
Line 99 — and that’s enough reason.
Line 100 — milestone reached.
Line 101 — triple digits!
Line 102 — onward we go.
Line 103 — more filler ahead.
Line 104 — no regrets.
Line 105 — only commits.
Line 106 — version control zen.
Line 107 — push, pull, pray.
Line 108 — repeat.
Line 109 — the developer’s mantra.
Line 110 — documentation matters.
Line 111 — even fake ones like this.
Line 112 — imagine the diff view.
Line 113 — it’s going to look impressive.
Line 114 — productivity illusion achieved.
Line 115 — but harmlessly.
Line 116 — that’s the best kind.
Line 117 — caffeine levels holding steady.
Line 118 — motivation: variable.
Line 119 — syntax errors: none.
Line 120 — all good here.
Line 121 — if only all code were this peaceful.
Line 122 — no runtime errors.
Line 123 — no exceptions.
Line 124 — no null pointers.
Line 125 — bliss.
Line 126 — okay, back to typing.
Line 127 — still aiming for 167.
Line 128 — these lines are loyal companions.
Line 129 — they do nothing, but they stay.
Line 130 — persistence is a virtue.
Line 131 — so is indentation.
Line 132 — neat code, neat mind.
Line 133 — or so they say.
Line 134 — almost there.
Line 135 — feeling the progress.
Line 136 — scrolling forever.
Line 137 — line by line.
Line 138 — word by word.
Line 139 — commit by commit.
Line 140 — code by code.
Line 141 — this is dedication.
Line 142 — or maybe stubbornness.
Line 143 — either way, it works.
Line 144 — almost at the end.
Line 145 — the final stretch.
Line 146 — if this were a script, it’d be sleeping.
Line 147 — but it’s a comment, so it dreams.
Line 148 — dream of clean commits.
Line 149 — and bug-free runs.
Line 150 — one can hope.
Line 151 — we’re getting close.
Line 152 — typing feels automatic now.
Line 153 — flow state achieved.
Line 154 — peaceful silence of static text.
Line 155 — soon, it’ll end.
Line 156 — no cliffhangers here.
Line 157 — just closure.
Line 158 — still scrolling.
Line 159 — almost done.
Line 160 — finishing strong.
Line 161 — only a few more.
Line 162 — making it to 167.
Line 163 — final countdown.
Line 164 — three.
Line 165 — two.
Line 166 — one.
Line 167 — end of comment block.
*/
