// Authentication Controller - Login, Signup, Profile Management
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { generateToken } from '../middleware/auth.js';

/**
 * User Registration (Signup)
 */
export const register = async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    const { email, password, name, role = 'customer', phone } = req.body;
    
    // Check if user already exists
    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
    
    // Insert new user
    const [result] = await conn.query(
      `INSERT INTO users (email, password_hash, name, role, phone, email_verified) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, password_hash, name, role, phone || null, false]
    );
    
    // Fetch created user
    const [users] = await conn.query(
      'SELECT id, email, name, role, phone, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    
    const user = users[0];
    const token = generateToken(user);
    
    res.status(201).json({
      message: 'Registration successful',
      user,
      token
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  } finally {
    conn.release();
  }
};

/**
 * User Login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [users] = await pool.query(
      'SELECT id, email, password_hash, name, role, is_active FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const user = users[0];
    
    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated. Please contact support.' });
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    
    // Remove password hash from response
    delete user.password_hash;
    
    const token = generateToken(user);
    
    res.json({
      message: 'Login successful',
      user,
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, email, name, role, phone, is_active, email_verified, created_at, last_login 
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user: users[0] });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updates = [];
    const values = [];
    
    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    
    if (phone) {
      updates.push('phone = ?');
      values.push(phone);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    values.push(req.user.id);
    
    await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );
    
    // Fetch updated user
    const [users] = await pool.query(
      'SELECT id, email, name, role, phone, is_active, email_verified FROM users WHERE id = ?',
      [req.user.id]
    );
    
    res.json({
      message: 'Profile updated successfully',
      user: users[0]
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    // Fetch user with password hash
    const [users] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(current_password, users[0].password_hash);
    
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const new_password_hash = await bcrypt.hash(new_password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
    
    // Update password
    await pool.query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [new_password_hash, req.user.id]
    );
    
    res.json({ message: 'Password changed successfully' });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
};

/**
 * Verify token (check if token is valid)
 */
export const verifyTokenEndpoint = (req, res) => {
  // If middleware passed, token is valid
  res.json({
    valid: true,
    user: req.user
  });
};

export default {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyTokenEndpoint
};
