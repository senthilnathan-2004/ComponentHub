import express from "express"
import {
  serveComponentDemo,
  serveComponentStatic
} from "../controllers/demoController.js"

const router = express.Router()

// Demo routes
router.get("/:id", serveComponentDemo)
router.get("/:id/*", serveComponentStatic)

export default router
