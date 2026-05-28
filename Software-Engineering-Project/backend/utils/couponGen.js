// backend/utils/couponGen.js
import crypto from 'crypto';

const DEFAULT_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function randomCode(length = 8, alphabet = DEFAULT_ALPHABET) {
  // Secure random bytes -> map to alphabet
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

export function hmacCode(code) {
  const secret = process.env.CODE_HMAC_SECRET;
  if (!secret) throw new Error('CODE_HMAC_SECRET is not defined in env');
  return crypto.createHmac('sha256', secret).update(code).digest('hex');
}

/**
 * generateUniqueCodeAndInsert
 * - pool: mysql2/promise pool
 * - options: { campaignId, prefix = '', maxRetries = 10, expiresAt = null }
 * Returns { id, code, codeHash }
 */
export async function generateUniqueCodeAndInsert(pool, { campaignId, prefix = '', maxRetries = 10, expiresAt = null }) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const code = prefix + randomCode(8);
    const codeHash = hmacCode(code);

    try {
      const [result] = await pool.query(
        `INSERT INTO coupons (code, campaign_id, code_hash, expires_at) VALUES (?, ?, ?, ?)`,
        [code, campaignId, codeHash, expiresAt]
      );
      return { id: result.insertId, code, codeHash };
    } catch (err) {
      // ER_DUP_ENTRY -> code duplicate, retry
      if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
        continue; // try again
      }
      // otherwise propagate
      throw err;
    }
  }

  throw new Error('Failed to generate unique code after retries');
}
