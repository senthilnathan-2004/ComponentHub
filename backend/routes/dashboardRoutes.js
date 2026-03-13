import express from "express"
import {
  getSellerStats,
  getUserPurchases,
  getUserFavorites,
  getAdminAnalytics,
  getSellerComponents,
  getUserOverview,
} from "../controllers/dashboardController.js"
import { protect, authorize } from "../middleware/auth.js"
import { getSeller } from "../controllers/sellerController.js"

const router = express.Router()

// Seller dashboard routes
router.get("/seller/:id/stats", protect, getSellerStats)
router.get("/seller/:id/components", protect, getSellerComponents)
router.get("/seller/:id", getSeller)

// User dashboard routes
router.get("/user/:id/overview", protect, getUserOverview)
router.get("/user/:id/purchases", protect, getUserPurchases)
router.get("/user/:id/favorites", protect, getUserFavorites)

// Admin dashboard routes
router.get("/admin/analytics", protect, authorize("admin"), getAdminAnalytics)

export default router