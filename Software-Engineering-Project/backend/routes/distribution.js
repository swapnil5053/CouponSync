// Distribution Routes - EPIC 3
import express from "express";
import { param } from "express-validator";
import {
  distributeCouponsEmail,
  distributeCouponsSMS,
  retryDistributions,
  getDistributionLogs,
  getCampaignDistributionStats,
} from "../controllers/distributionController.js";
import {
  verifyToken,
  requireMerchant,
  requireAdmin,
} from "../middleware/auth.js";
import {
  validateEmailDistribution,
  validateSMSDistribution,
  handleValidationErrors,
} from "../middleware/validation.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();
const validateCampaignIdParam = [
  param("campaign_id")
    .isInt({ min: 1 })
    .withMessage("Valid campaign ID is required"),
  handleValidationErrors,
];

// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

// Distribution operations
router.post(
  "/email",
  requireMerchant,
  validateEmailDistribution,
  distributeCouponsEmail,
);
router.post(
  "/sms",
  requireMerchant,
  validateSMSDistribution,
  distributeCouponsSMS,
);
router.post("/retry", requireAdmin, retryDistributions);

// Distribution logs and stats
router.get("/logs", getDistributionLogs);
router.get(
  "/campaign/:campaign_id/stats",
  validateCampaignIdParam,
  getCampaignDistributionStats,
);

export default router;
