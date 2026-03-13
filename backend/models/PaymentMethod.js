import mongoose from "mongoose"

const paymentMethodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["card", "paypal"],
      required: true,
    },
    stripePaymentMethodId: String,
    // Card details (last 4 digits only for security)
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number,
    // PayPal details
    paypalEmail: String,
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Ensure only one default payment method per user
paymentMethodSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany({ user: this.user, _id: { $ne: this._id } }, { isDefault: false })
  }
  next()
})

export default mongoose.model("PaymentMethod", paymentMethodSchema)
