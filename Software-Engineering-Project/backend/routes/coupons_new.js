// Coupon Routes - EPIC 2
import express from "express";
import {
  generateCoupons,
  getAllCoupons,
  getCoupon,
  generateQRCode,
  assignCoupon,
  expireCoupons,
  deleteCoupon
} from "../controllers/couponController_new.js";
import { verifyToken, requireMerchant, requireAdmin } from '../middleware/auth.js';
import { validateCouponGeneration, validateId } from '../middleware/validation.js';
import { apiLimiter, generationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

// Coupon operations
router.get("/", getAllCoupons);
router.post("/generate", generationLimiter, validateCouponGeneration, generateCoupons);
router.get("/:identifier", getCoupon);
router.post("/:id/qr", validateId, generateQRCode);
router.post("/:id/assign", requireMerchant, validateId, assignCoupon);
router.post("/expire", requireAdmin, expireCoupons);
router.delete("/:id", requireMerchant, validateId, deleteCoupon);

export default router;
