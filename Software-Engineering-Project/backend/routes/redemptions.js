// backend/routes/redemptions.js
import express from "express";
import { 
  redeemCoupon,
  validateCoupon,
  getRedemptionHistory,
  getFraudAttempts,
  getRedemptions 
} from "../controllers/redemptionController.js";
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post("/redeem", redeemCoupon);
router.get("/validate/:code", validateCoupon);

// Protected routes
router.get("/history", authenticate, getRedemptionHistory);
router.get("/fraud-attempts", authenticate, getFraudAttempts);

// Legacy route
router.get("/", getRedemptions);

export default router;
