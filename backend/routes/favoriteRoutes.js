import express from "express";
import {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  checkFavorite,
} from "../controllers/favoriteController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication and buyer role
router.use(protect);
router.use(authorize("buyer"));

// @route   POST /api/favorites
// @desc    Add component to favorites
// @access  Private (Buyer only)
router.post("/", addToFavorites);

// @route   GET /api/favorites
// @desc    Get user's favorite components
// @access  Private (Buyer only)
router.get("/", getUserFavorites);

// @route   GET /api/favorites/check/:componentId
// @desc    Check if component is in user's favorites
// @access  Private (Buyer only)
router.get("/check/:componentId", checkFavorite);

// @route   DELETE /api/favorites/:componentId
// @desc    Remove component from favorites
// @access  Private (Buyer only)
router.delete("/:componentId", removeFromFavorites);

export default router;
