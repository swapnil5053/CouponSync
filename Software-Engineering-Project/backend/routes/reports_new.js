// Reports Routes - EPIC 5
import express from "express";
import {
  getMerchantReports,
  getDashboardAnalytics,
  exportReportCSV,
  getCampaignMetrics,
  getSystemStats,
  getCustomerStats
} from "../controllers/reportController_simple.js";
import { verifyToken, requireMerchant, requireAdmin } from '../middleware/auth.js';
import { validateId } from '../middleware/validation.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

// Reports and analytics
router.get("/merchant", requireMerchant, getMerchantReports);
router.get("/dashboard", getDashboardAnalytics);
router.get("/export-csv", requireMerchant, exportReportCSV);
router.get("/campaign/:id/metrics", validateId, getCampaignMetrics);
router.get("/system-stats", requireAdmin, getSystemStats);
router.get("/customer-stats", getCustomerStats);

export default router;
