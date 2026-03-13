import Stripe from "stripe"
import Purchase from "../models/Purchase.js"
import PaymentMethod from "../models/PaymentMethod.js"
import Component from "../models/Component.js"
import { v4 as uuidv4 } from "uuid"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// @desc    Create payment intent
// @route   POST /api/payments/intent
// @access  Private
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { componentId, amount } = req.body

    // Verify component exists and get details
    const component = await Component.findById(componentId).populate("seller", "name")

    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      })
    }

    // Verify amount matches component price
    if (amount !== component.price * 100) {
      // Stripe uses cents
      return res.status(400).json({
        error: {
          message: "Amount does not match component price",
          code: "INVALID_AMOUNT",
        },
      })
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      metadata: {
        componentId: componentId,
        buyerId: req.user.id,
        sellerId: component.seller._id.toString(),
        componentName: component.title,
      },
    })

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Process component purchase
// @route   POST /api/payments/purchase
// @access  Private
export const processPurchase = async (req, res, next) => {
  try {
    const { componentId, paymentMethod, paymentIntentId } = req.body

    // Get component details
    const component = await Component.findById(componentId).populate("seller", "name email")

    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      })
    }

    // Check if user already purchased this component
    const existingPurchase = await Purchase.findOne({
      component: componentId,
      buyer: req.user.id,
      status: "completed",
    })

    if (existingPurchase) {
      return res.status(400).json({
        error: {
          message: "You have already purchased this component",
          code: "ALREADY_PURCHASED",
        },
      })
    }

    // Verify payment with Stripe
    let paymentIntent
    if (paymentIntentId) {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          error: {
            message: "Payment not completed",
            code: "PAYMENT_INCOMPLETE",
          },
        })
      }
    }

    // Generate unique transaction ID
    const transactionId = `txn_${uuidv4()}`

    // Create download URL (in production, this would be a secure signed URL)
    const downloadUrl = `/api/payments/download/${componentId}/${req.user.id}`

    // Create purchase record
    const purchase = await Purchase.create({
      component: componentId,
      buyer: req.user.id,
      seller: component.seller._id,
      amount: component.price,
      paymentMethod: paymentMethod,
      transactionId: transactionId,
      stripePaymentIntentId: paymentIntentId,
      status: "completed",
      downloadUrl: downloadUrl,
      receipt: {
        componentName: component.title,
        sellerName: component.seller.name,
        buyerName: req.user.name,
        buyerEmail: req.user.email,
        purchaseDate: new Date(),
      },
    })

    // Update component download count
    component.downloads += 1
    await component.save()

    res.status(200).json({
      success: true,
      transactionId: transactionId,
      purchaseId: purchase._id,
      downloadUrl: downloadUrl,
      receipt: purchase.receipt,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get user payment methods
// @route   GET /api/payments/methods
// @access  Private
export const getPaymentMethods = async (req, res, next) => {
  try {
    const paymentMethods = await PaymentMethod.find({
      user: req.user.id,
      isActive: true,
    }).sort({ isDefault: -1, createdAt: -1 })

    res.status(200).json(
      paymentMethods.map((method) => ({
        id: method._id,
        type: method.type,
        last4: method.last4,
        brand: method.brand,
        expiryMonth: method.expiryMonth,
        expiryYear: method.expiryYear,
        paypalEmail: method.paypalEmail,
        isDefault: method.isDefault,
      })),
    )
  } catch (error) {
    next(error)
  }
}

// @desc    Add payment method
// @route   POST /api/payments/methods
// @access  Private
export const addPaymentMethod = async (req, res, next) => {
  try {
    const { type, stripePaymentMethodId, isDefault } = req.body

    const paymentMethodData = {
      user: req.user.id,
      type: type,
      isDefault: isDefault || false,
    }

    if (type === "card" && stripePaymentMethodId) {
      // Get card details from Stripe
      const stripePaymentMethod = await stripe.paymentMethods.retrieve(stripePaymentMethodId)

      paymentMethodData.stripePaymentMethodId = stripePaymentMethodId
      paymentMethodData.last4 = stripePaymentMethod.card.last4
      paymentMethodData.brand = stripePaymentMethod.card.brand
      paymentMethodData.expiryMonth = stripePaymentMethod.card.exp_month
      paymentMethodData.expiryYear = stripePaymentMethod.card.exp_year
    }

    const paymentMethod = await PaymentMethod.create(paymentMethodData)

    res.status(201).json({
      message: "Payment method added successfully",
      paymentMethodId: paymentMethod._id,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1
    const perPage = Number.parseInt(req.query.perPage, 10) || 10
    const startIndex = (page - 1) * perPage

    const purchases = await Purchase.find({ buyer: req.user.id })
      .populate("component", "title screenshots")
      .populate("seller", "name")
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(perPage)

    const total = await Purchase.countDocuments({ buyer: req.user.id })

    res.status(200).json({
      items: purchases.map((purchase) => ({
        id: purchase._id,
        component: {
          id: purchase.component._id,
          title: purchase.component.title,
          screenshot: purchase.component.screenshots[0],
        },
        seller: {
          name: purchase.seller.name,
        },
        amount: purchase.amount,
        status: purchase.status,
        transactionId: purchase.transactionId,
        downloadUrl: purchase.downloadUrl,
        downloadCount: purchase.downloadCount,
        maxDownloads: purchase.maxDownloads,
        purchaseDate: purchase.createdAt,
        expiresAt: purchase.expiresAt,
      })),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Download purchased component
// @route   GET /api/payments/download/:componentId/:userId
// @access  Private
export const downloadComponent = async (req, res, next) => {
  try {
    const { componentId, userId } = req.params

    // Verify user is downloading their own purchase
    if (req.user.id !== userId) {
      return res.status(403).json({
        error: {
          message: "Not authorized to download this component",
          code: "FORBIDDEN",
        },
      })
    }

    // Find purchase record
    const purchase = await Purchase.findOne({
      component: componentId,
      buyer: userId,
      status: "completed",
    }).populate("component")

    if (!purchase) {
      return res.status(404).json({
        error: {
          message: "Purchase not found or not completed",
          code: "PURCHASE_NOT_FOUND",
        },
      })
    }

    // Check download limits
    if (purchase.downloadCount >= purchase.maxDownloads) {
      return res.status(403).json({
        error: {
          message: "Download limit exceeded",
          code: "DOWNLOAD_LIMIT_EXCEEDED",
        },
      })
    }

    // Check expiration
    if (purchase.expiresAt < new Date()) {
      return res.status(403).json({
        error: {
          message: "Download link has expired",
          code: "DOWNLOAD_EXPIRED",
        },
      })
    }

    // Increment download count
    purchase.downloadCount += 1
    await purchase.save()

    // In a real implementation, you would:
    // 1. Create a ZIP file with all component files
    // 2. Stream the file to the user
    // 3. Use signed URLs for security

    // For now, return file information
    res.status(200).json({
      message: "Download started",
      files: purchase.component.files,
      downloadCount: purchase.downloadCount,
      remainingDownloads: purchase.maxDownloads - purchase.downloadCount,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
// @access  Public (Stripe)
export const handleStripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers["stripe-signature"]
    let event

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object
        console.log("PaymentIntent was successful!", paymentIntent.id)
        break
      case "payment_intent.payment_failed":
        const failedPayment = event.data.object
        console.log("PaymentIntent failed!", failedPayment.id)

        // Update purchase status to failed
        await Purchase.updateOne({ stripePaymentIntentId: failedPayment.id }, { status: "failed" })
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    next(error)
  }
}
