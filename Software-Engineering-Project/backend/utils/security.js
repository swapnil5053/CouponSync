// Security utilities for VCDS - AES-256 Encryption, Code Generation, etc.
import crypto from 'crypto';

// AES-256 Encryption Configuration
const ALGORITHM = 'aes-256-cbc';
// Ensure the key is exactly 32 bytes for AES-256
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'utf8').subarray(0, 32)
  : crypto.randomBytes(32); // Generate a random key if not provided
const IV_LENGTH = 16;

/**
 * EPIC 2: Story 3 - Encrypt data using AES-256
 */
export const encrypt = (text) => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

/**
 * EPIC 2: Story 3 - Decrypt data using AES-256
 */
export const decrypt = (text) => {
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = parts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
};

/**
 * EPIC 2: Story 1 & 2 - Generate unique, random alphanumeric coupon code
 * Uses crypto.randomBytes for cryptographic randomness
 */
export const generateCouponCode = (length = 12, prefix = '') => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomBytes = crypto.randomBytes(length);
  
  let code = prefix;
  for (let i = 0; i < length; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  
  return code;
};

/**
 * EPIC 2: Story 5 - Generate multiple unique codes ensuring no duplicates
 */
export const generateUniqueCodes = async (count, length = 12, prefix = '', existingCodes = new Set()) => {
  const codes = new Set();
  let attempts = 0;
  const maxAttempts = count * 10; // Prevent infinite loops
  
  while (codes.size < count && attempts < maxAttempts) {
    const code = generateCouponCode(length, prefix);
    
    // Check against both new codes and existing codes in DB
    if (!codes.has(code) && !existingCodes.has(code)) {
      codes.add(code);
    }
    attempts++;
  }
  
  if (codes.size < count) {
    throw new Error('Unable to generate required number of unique codes');
  }
  
  return Array.from(codes);
};

/**
 * EPIC 4: Story 4 - Generate device fingerprint for fraud detection
 */
export const generateDeviceFingerprint = (req) => {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.ip || req.connection.remoteAddress || ''
  ];
  
  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
};

/**
 * EPIC 4: Story 4 - Calculate fraud risk score based on patterns
 */
export const calculateFraudScore = (redemptionHistory, ipHistory, deviceHistory) => {
  let score = 0;
  
  // Multiple redemptions from same IP (weight: 30)
  if (ipHistory.length > 5) score += 30;
  else if (ipHistory.length > 3) score += 20;
  else if (ipHistory.length > 1) score += 10;
  
  // Multiple redemptions from same device (weight: 25)
  if (deviceHistory.length > 5) score += 25;
  else if (deviceHistory.length > 3) score += 15;
  else if (deviceHistory.length > 1) score += 8;
  
  // Rapid redemption attempts (weight: 25)
  if (redemptionHistory.length > 0) {
    const recentAttempts = redemptionHistory.filter(r => {
      const timeDiff = Date.now() - new Date(r.redeemed_at).getTime();
      return timeDiff < 3600000; // Last hour
    });
    
    if (recentAttempts.length > 10) score += 25;
    else if (recentAttempts.length > 5) score += 15;
    else if (recentAttempts.length > 3) score += 8;
  }
  
  // Pattern of failed attempts (weight: 20)
  const failedAttempts = redemptionHistory.filter(r => r.redemption_status === 'failed').length;
  if (failedAttempts > 10) score += 20;
  else if (failedAttempts > 5) score += 12;
  else if (failedAttempts > 2) score += 6;
  
  return Math.min(score, 100); // Cap at 100
};

/**
 * Hash password using crypto (for additional security layer)
 */
export const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Generate secure random token
 */
export const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

export default {
  encrypt,
  decrypt,
  generateCouponCode,
  generateUniqueCodes,
  generateDeviceFingerprint,
  calculateFraudScore,
  hashPassword,
  generateToken
};
