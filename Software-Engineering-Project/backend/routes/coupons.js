// backend/routes/coupons.js
import express from 'express';
import { generateCoupons, redeemCoupon, getCoupons } from '../controllers/couponController.js';
const router = express.Router();

// GET /api/coupons?campaignId=...
router.get('/', getCoupons);

// POST /api/coupons/generate
router.post('/generate', generateCoupons);

// POST /api/coupons/redeem
router.post('/redeem', redeemCoupon);

export default router;
