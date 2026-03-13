import express from "express"
import {
  getComponents,
  getComponent,
  createComponent,
  updateComponent,
  deleteComponent,
  togglePublish,
  toggleStar,
  getComponentReviews,
  addComponentReview,
  handleDownload,
  getComponentDemo,
  getDashboardTopRated,
} from "../controllers/componentController.js"
import { protect, authorize } from "../middleware/auth.js"
import { validateComponent } from "../middleware/validation.js"

const router = express.Router()

// Public routes
router.get("/", getComponents)
router.get("/dashboard-top-rated", getDashboardTopRated)
router.get("/:id", getComponent)
router.get("/:id/reviews", getComponentReviews)
router.get("/:id/demo", getComponentDemo)

// Protected routes
router.post("/", protect, authorize("seller", "admin"), validateComponent, createComponent)
router.put("/:id", protect, updateComponent)
router.delete("/:id", protect, deleteComponent)
router.put("/:id/publish", protect, togglePublish)
router.post("/:id/star", protect, toggleStar)
router.post("/:id/reviews", protect, addComponentReview)
router.post("/:id/download", protect, handleDownload)

export default router
