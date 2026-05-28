// Campaign Routes - EPIC 1
import express from "express";
import {
  getAllCampaigns,
  createCampaign,
  getCampaignById,
  updateCampaign,
  updateCampaignStatus,
  deleteCampaign,
  getCampaignStats
} from "../controllers/campaignController.js";
import { verifyToken, requireMerchant } from '../middleware/auth.js';
import { validateCampaignCreation, validateCampaignUpdate, validateId } from '../middleware/validation.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

// Campaign CRUD
router.get("/", getAllCampaigns); // Merchants see their own, admins see all
router.post("/", requireMerchant, validateCampaignCreation, createCampaign);
router.get("/:id", validateId, getCampaignById);
router.put("/:id", requireMerchant, validateId, validateCampaignUpdate, updateCampaign);
router.patch("/:id/status", requireMerchant, validateId, updateCampaignStatus);
router.delete("/:id", requireMerchant, validateId, deleteCampaign);

// Campaign statistics
router.get("/:id/stats", validateId, getCampaignStats);

export default router;
