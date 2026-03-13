import mongoose from "mongoose"

const purchaseSchema = new mongoose.Schema(
  {
    component: {
      type: mongoose.Schema.ObjectId,
      ref: "Component",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "paypal"],
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    stripePaymentIntentId: String,
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    downloadUrl: String,
    downloadCount: {
      type: Number,
      default: 0,
    },
    maxDownloads: {
      type: Number,
      default: 5,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    receipt: {
      componentName: String,
      sellerName: String,
      buyerName: String,
      buyerEmail: String,
      purchaseDate: {
        type: Date,
        default: Date.now,
      },
    },
    refund: {
      refundId: String,
      refundAmount: Number,
      refundReason: String,
      refundedAt: Date,
      refundedBy: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
purchaseSchema.index({ buyer: 1, createdAt: -1 })
purchaseSchema.index({ seller: 1, createdAt: -1 })
purchaseSchema.index({ component: 1 })
purchaseSchema.index({ transactionId: 1 })

export default mongoose.model("Purchase", purchaseSchema)
