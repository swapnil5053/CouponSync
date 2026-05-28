// Redemption Routes - Simplified
import express from "express";
import {
  redeemCoupon,
  validateCoupon,
  getRedemptionHistory
} from "../controllers/redemptionController_simple.js";
import { verifyToken, optionalAuth } from '../middleware/auth.js';
import { validateCouponRedemption } from '../middleware/validation.js';
import { apiLimiter, redemptionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(apiLimiter);

// Redemption operations
router.post("/redeem", optionalAuth, redemptionLimiter, validateCouponRedemption, redeemCoupon);
router.get("/validate/:code", optionalAuth, validateCoupon);

// Protected routes
router.get("/history", verifyToken, getRedemptionHistory);

export default router;
