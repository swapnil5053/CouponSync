// JWT Authentication and Authorization Middleware
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * Generate JWT token for user
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Verify JWT token middleware
 */
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided. Authorization required.' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch fresh user data from database
    const [users] = await pool.query(
      'SELECT id, email, name, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found.' });
    }
    
    const user = users[0];
    
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated.' });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    return res.status(500).json({ message: 'Token verification failed.' });
  }
};

/**
 * EPIC 5: Story 3 - Role-Based Access Control (RBAC)
 * Check if user has required role
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}` 
      });
    }
    
    next();
  };
};

/**
 * Check if user is admin
 */
export const requireAdmin = requireRole('admin');

/**
 * Check if user is merchant or admin
 */
export const requireMerchant = requireRole('admin', 'merchant');

/**
 * Check if user is customer
 */
export const requireCustomer = requireRole('customer');

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const [users] = await pool.query(
        'SELECT id, email, name, role, is_active FROM users WHERE id = ?',
        [decoded.id]
      );
      
      if (users.length > 0 && users[0].is_active) {
        req.user = users[0];
      }
    }
  } catch (error) {
    // Continue without user
  }
  
  next();
};

export default {
  generateToken,
  verifyToken,
  requireRole,
  requireAdmin,
  requireMerchant,
  requireCustomer,
  optionalAuth
};
