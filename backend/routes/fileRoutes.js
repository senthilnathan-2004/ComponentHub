import express from "express"
import {
  uploadComponentFiles,
  uploadScreenshots,
  deleteComponentFile,
  getFileContent,
  downloadComponentZip,
  downloadComponentZipStream
} from "../controllers/fileController.js"
import { protect } from "../middleware/auth.js"
import {
  uploadComponentFiles as uploadMiddleware,
  uploadScreenshots as screenshotMiddleware,
  handleUploadError,
} from "../middleware/upload.js"

const router = express.Router()

// File upload routes
router.post("/:id/files", protect, uploadMiddleware, handleUploadError, uploadComponentFiles)//
router.post("/:id/screenshots", protect, screenshotMiddleware, handleUploadError, uploadScreenshots)

// File management routes
router.delete("/:id/files/:fileId", protect, deleteComponentFile)
router.get("/:id/files/:fileId/content", getFileContent)
router.get("/:id/download", protect, downloadComponentZip)
router.get("/:id/download-zip",protect, downloadComponentZipStream);

export default router
