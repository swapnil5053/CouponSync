// User Management Routes
import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
} from "../controllers/userController.js";
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { validateUserRegistration, validateId } from '../middleware/validation.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken);
router.use(requireAdmin);
router.use(apiLimiter);

// User CRUD
router.get("/", getUsers);
router.get("/stats", getUserStats);
router.get("/:id", validateId, getUserById);
router.post("/", validateUserRegistration, createUser);
router.put("/:id", validateId, updateUser);
router.delete("/:id", validateId, deleteUser);

export default router;
