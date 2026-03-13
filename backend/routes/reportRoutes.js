// routes/reportRoutes.js
import express from "express"
import { body } from "express-validator"
import rateLimit from "express-rate-limit"
import multer from "multer"
import { optionalAuth } from "../middleware/optionalAuth.js"
import { requireAdmin } from "../middleware/adminAuth.js"
import {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  deleteReport,
} from "../controllers/reportController.js"

const router = express.Router()

// small per-IP rate limiter for anonymous reports
const createReportLimiter = rateLimit({
  windowMs: 1000 * 60 * 60, // 1 hour
  max: 6, // adjust as needed
  message: { error: { message: "Too many reports from this IP, try again later", code: "RATE_LIMIT" } },
})

// Multer config (example: local disk). For production use S3 or similar.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/reports"),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }) // 5 MB per file

// Public - create a new report (optional auth)
router.post(
  "/",
  optionalAuth,
  createReportLimiter,
  upload.array("attachments", 4),
  [
    body("component").isMongoId().withMessage("Valid component id is required"),
    body("reason").isString().notEmpty().withMessage("Reason required"),
    body("description").isString().isLength({ min: 5, max: 2000 }).withMessage("Description required"),
    // name/email optional
  ],
  createReport,
)

// Admin routes
router.use("/admin", requireAdmin)

router.get("/admin/reports", getReports)
router.get("/admin/reports/:id", getReportById)
router.put("/admin/reports/:id", updateReportStatus)
router.delete("/admin/reports/:id", deleteReport)

export default router
