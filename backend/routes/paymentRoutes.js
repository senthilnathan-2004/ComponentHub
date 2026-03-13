import express from "express"
import {
  createPaymentIntent,
  processPurchase,
  getPaymentMethods,
  addPaymentMethod,
  getPaymentHistory,
  downloadComponent,
  handleStripeWebhook,
} from "../controllers/paymentController.js"
import { protect } from "../middleware/auth.js"

const router = express.Router()

// Stripe webhook (must be before other middleware)
router.post("/webhook", express.raw({ type: "application/json" }), handleStripeWebhook)

// Protected routes
router.post("/intent", protect, createPaymentIntent)
router.post("/purchase", protect, processPurchase)
router.get("/methods", protect, getPaymentMethods)
router.post("/methods", protect, addPaymentMethod)
router.get("/history", protect, getPaymentHistory)
router.get("/download/:componentId/:userId", protect, downloadComponent)

export default router
