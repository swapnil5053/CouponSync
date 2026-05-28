// EPIC 3: Distribution Services - Email, SMS, QR Code
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import pool from '../db.js';

// Email transporter configuration (conditional - only create if credentials exist)
const emailTransporter = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD 
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  : null;

// Twilio client configuration
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * EPIC 3: Story 1 - Distribute coupons via Email
 */
export const distributeViaEmail = async (recipients, coupons, campaign) => {
  if (!emailTransporter) {
    throw new Error('Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env');
  }
  
  const results = [];
  
  for (let i = 0; i < recipients.length && i < coupons.length; i++) {
    const recipient = recipients[i];
    const coupon = coupons[i];
    
    try {
      // Create distribution log
      const [logResult] = await pool.query(
        `INSERT INTO distribution_logs (coupon_id, channel, recipient, status, attempt_count) 
         VALUES (?, 'email', ?, 'pending', 1)`,
        [coupon.id, recipient]
      );
      
      const logId = logResult.insertId;
      
      // Send email
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: recipient,
        subject: `Your Exclusive Coupon: ${campaign.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">🎉 You've Received a Special Coupon!</h2>
            <p>Dear Valued Customer,</p>
            <p>We're excited to share an exclusive offer with you from <strong>${campaign.name}</strong>!</p>
            
            <div style="background: #F3F4F6; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your Coupon Code:</h3>
              <div style="background: white; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; text-align: center; color: #4F46E5; letter-spacing: 2px;">
                ${coupon.code}
              </div>
            </div>
            
            <div style="background: #EEF2FF; padding: 15px; border-radius: 10px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #4F46E5;">Offer Details:</h4>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Discount:</strong> ${campaign.discount_type === 'percentage' ? campaign.discount_value + '%' : '$' + campaign.discount_value} OFF</li>
                <li><strong>Valid Until:</strong> ${new Date(coupon.expiry_date).toLocaleDateString()}</li>
              </ul>
            </div>
            
            ${campaign.terms_conditions ? `
              <div style="font-size: 12px; color: #6B7280; margin-top: 20px;">
                <p><strong>Terms & Conditions:</strong></p>
                <p>${campaign.terms_conditions}</p>
              </div>
            ` : ''}
            
            <p style="margin-top: 30px;">Don't miss out on this amazing offer!</p>
            <p style="color: #6B7280; font-size: 14px;">This is an automated email. Please do not reply.</p>
          </div>
        `
      };
      
      await emailTransporter.sendMail(mailOptions);
      
      // Update distribution log
      await pool.query(
        'UPDATE distribution_logs SET status = ?, delivered_at = NOW() WHERE id = ?',
        ['delivered', logId]
      );
      
      // Update coupon status
      await pool.query(
        'UPDATE coupons SET status = ? WHERE id = ?',
        ['distributed', coupon.id]
      );
      
      results.push({ success: true, recipient, coupon_code: coupon.code });
    } catch (error) {
      console.error(`Email distribution failed for ${recipient}:`, error);
      
      // Update distribution log with error
      await pool.query(
        'UPDATE distribution_logs SET status = ?, error_message = ?, last_attempt_at = NOW() WHERE coupon_id = ? AND recipient = ? ORDER BY id DESC LIMIT 1',
        ['failed', error.message, coupon.id, recipient]
      );
      
      results.push({ success: false, recipient, error: error.message });
    }
  }
  
  return results;
};

/**
 * EPIC 3: Story 2 - Distribute coupons via SMS
 */
export const distributeViaSMS = async (recipients, coupons, campaign) => {
  if (!twilioClient) {
    throw new Error('Twilio not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
  }
  
  const results = [];
  
  for (let i = 0; i < recipients.length && i < coupons.length; i++) {
    const recipient = recipients[i];
    const coupon = coupons[i];
    
    try {
      // Create distribution log
      const [logResult] = await pool.query(
        `INSERT INTO distribution_logs (coupon_id, channel, recipient, status, attempt_count) 
         VALUES (?, 'sms', ?, 'pending', 1)`,
        [coupon.id, recipient]
      );
      
      const logId = logResult.insertId;
      
      // Send SMS
      const message = `🎉 Your ${campaign.name} Coupon: ${coupon.code}\n` +
        `${campaign.discount_type === 'percentage' ? campaign.discount_value + '%' : '$' + campaign.discount_value} OFF\n` +
        `Valid until: ${new Date(coupon.expiry_date).toLocaleDateString()}\n` +
        `Redeem at: ${process.env.FRONTEND_URL}/redeem`;
      
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: recipient
      });
      
      // Update distribution log
      await pool.query(
        'UPDATE distribution_logs SET status = ?, delivered_at = NOW() WHERE id = ?',
        ['delivered', logId]
      );
      
      // Update coupon status
      await pool.query(
        'UPDATE coupons SET status = ? WHERE id = ?',
        ['distributed', coupon.id]
      );
      
      results.push({ success: true, recipient, coupon_code: coupon.code });
    } catch (error) {
      console.error(`SMS distribution failed for ${recipient}:`, error);
      
      // Update distribution log with error
      await pool.query(
        'UPDATE distribution_logs SET status = ?, error_message = ?, last_attempt_at = NOW() WHERE coupon_id = ? AND recipient = ? ORDER BY id DESC LIMIT 1',
        ['failed', error.message, coupon.id, recipient]
      );
      
      results.push({ success: false, recipient, error: error.message });
    }
  }
  
  return results;
};

/**
 * EPIC 3: Story 4 - Retry failed distributions
 */
export const retryFailedDistributions = async () => {
  try {
    // Get failed distributions that haven't exceeded max attempts
    const [failedLogs] = await pool.query(
      `SELECT dl.*, c.code, c.campaign_id, camp.name as campaign_name, camp.discount_type, camp.discount_value
       FROM distribution_logs dl
       LEFT JOIN coupons c ON dl.coupon_id = c.id
       LEFT JOIN campaigns camp ON c.campaign_id = camp.id
       WHERE dl.status = 'failed' 
       AND dl.attempt_count < dl.max_attempts
       AND dl.last_attempt_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
       LIMIT 100`
    );
    
    const results = [];
    
    for (const log of failedLogs) {
      try {
        // Increment attempt count
        await pool.query(
          'UPDATE distribution_logs SET attempt_count = attempt_count + 1, last_attempt_at = NOW() WHERE id = ?',
          [log.id]
        );
        
        const campaign = {
          name: log.campaign_name,
          discount_type: log.discount_type,
          discount_value: log.discount_value
        };
        
        const coupon = {
          id: log.coupon_id,
          code: log.code,
          expiry_date: log.expiry_date
        };
        
        if (log.channel === 'email') {
          await distributeViaEmail([log.recipient], [coupon], campaign);
        } else if (log.channel === 'sms') {
          await distributeViaSMS([log.recipient], [coupon], campaign);
        }
        
        results.push({ success: true, log_id: log.id, recipient: log.recipient });
      } catch (error) {
        console.error(`Retry failed for log ${log.id}:`, error);
        results.push({ success: false, log_id: log.id, error: error.message });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Retry failed distributions error:', error);
    throw error;
  }
};

/**
 * Get distribution statistics
 */
export const getDistributionStats = async (campaign_id) => {
  try {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_distributions,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN channel = 'email' THEN 1 END) as email_distributions,
        COUNT(CASE WHEN channel = 'sms' THEN 1 END) as sms_distributions,
        COUNT(CASE WHEN channel = 'qr' THEN 1 END) as qr_distributions
      FROM distribution_logs dl
      LEFT JOIN coupons c ON dl.coupon_id = c.id
      WHERE c.campaign_id = ?`,
      [campaign_id]
    );
    
    return stats[0];
  } catch (error) {
    console.error('Get distribution stats error:', error);
    throw error;
  }
};

export default {
  distributeViaEmail,
  distributeViaSMS,
  retryFailedDistributions,
  getDistributionStats
};
/* 
Just testing some minor tweaks in the script today.
Trying to make sure everything syncs correctly on GitHub.
Sometimes the smallest edits cause the biggest merges.
Coffee count: probably too many.
Debug mode may or may not be chaos right now.
Adding comments just to stay organized.
Future me, don’t delete this line — it means something.
Or maybe it doesn’t. Hard to say.
The code works, that’s what matters.
Consistency is key… sometimes.
Still wondering why this bug appeared.
Might just be cache again, who knows.
Line count looks good so far.
Almost there, just a few more lines.
Keeping this here for reference later.
Randomness keeps life interesting.
This is not a bug, it’s a feature.
If you’re reading this, good luck debugging.
Commit message: “minor adjustments for upload”.
End of mysterious comment block.
*/
