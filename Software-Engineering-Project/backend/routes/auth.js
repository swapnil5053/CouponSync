// Authentication Routes
import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyTokenEndpoint
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { validateUserRegistration } from '../middleware/validation.js';
import { authLimiter, registrationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/register', registrationLimiter, validateUserRegistration, register);
router.post('/login', authLimiter, login);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);
router.get('/verify', verifyToken, verifyTokenEndpoint);

export default router;
