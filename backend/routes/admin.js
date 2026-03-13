import express from "express"
import jwt from "jsonwebtoken"
import {
  getAdminDashboard,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getAllComponents,
  updateComponentStatus,
  toggleComponentFeatured,
  getAllReviews,
  updateReviewStatus,
  getPlatformStatistics,
  deleteUser,
  getRecentActivity,
  deleteComponent,
  suspendUser,
  activateUser,
  approveComponent,
  rejectComponent,
  getAllPurchases,
} from "../controllers/adminController.js"
import { requireAdmin } from "../middleware/adminAuth.js"
import User from "../models/User.js"
import Component from "../models/Component.js"
import Review from "../models/Review.js"

const router = express.Router()

// Authentication routes (no auth required)
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: "Email and password are required",
          code: "MISSING_CREDENTIALS",
        },
      })
    }

    // Find admin user
    const user = await User.findOne({ email, role: "admin" }).select("+password")

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: {
          message: "Invalid credentials or account inactive",
          code: "INVALID_CREDENTIALS",
        },
      })
    }

    // Check password
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({
        error: {
          message: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        },
      })
    }

    // Generate tokens
    const token = user.getSignedJwtToken()
    const refreshToken = user.getRefreshToken()

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    next(error)
  }
})

//logout
router.post("/logout", async (req, res, next) => {
  try {
    res.json({ message: "Logged out successfully" })
  } catch (error) {
    next(error)
  }
})



router.post("/refresh-token", async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          message: "Refresh token is required",
          code: "MISSING_REFRESH_TOKEN",
        },
      })
    }

    // Verify refresh token and generate new access token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const user = await User.findById(decoded.id)

    if (!user || !user.isActive || user.role !== "admin") {
      return res.status(401).json({
        error: {
          message: "Invalid refresh token",
          code: "INVALID_REFRESH_TOKEN",
        },
      })
    }

    const newToken = user.getSignedJwtToken()

    res.status(200).json({
      success: true,
      token: newToken,
    })
  } catch (error) {
    next(error)
  }
})

router.post("/logout", async (req, res, next) => {
  try {
    res.json({ message: "Logged out successfully" })
  } catch (error) {
    next(error)
  }
})


// All routes below require admin authentication
router.use(requireAdmin)

// Dashboard and Analytics
router.get("/dashboard", getAdminDashboard)
router.get("/statistics", getPlatformStatistics)
router.get("/activity", getRecentActivity)

// User Management
router.get("/users", getAllUsers)
router.get("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password -refreshTokens")
    if (!user) {
      return res.status(404).json({ error: { message: "User not found" } })
    }
    res.json(user)
  } catch (error) {
    next(error)
  }
})
router.put("/users/:id/status", updateUserStatus)
router.put("/users/:id/role", updateUserRole)
router.delete("/users/:id", deleteUser)
router.put("/users/:id/suspend", suspendUser)
router.put("/users/:id/activate", activateUser)

// Component Management
router.get("/components", getAllComponents)
router.get("/components/:id", async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id).populate("seller", "name email")
    if (!component) {
      return res.status(404).json({ error: { message: "Component not found" } })
    }
    res.json(component)
  } catch (error) {
    next(error)
  }
})
router.put("/components/:id/status", updateComponentStatus)
router.put("/components/:id/featured", toggleComponentFeatured)
router.delete("/components/:id", deleteComponent)
router.put("/components/:id/approve", approveComponent)
router.put("/components/:id/reject", rejectComponent)

// Review Management
router.get("/reviews", getAllReviews)
router.get("/reviews/:id", async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id).populate("user", "name email").populate("component", "title")
    if (!review) {
      return res.status(404).json({ error: { message: "Review not found" } })
    }
    res.json(review)
  } catch (error) {
    next(error)
  }
})
router.put("/reviews/:id/status", updateReviewStatus)
router.put("/reviews/:id/approve", async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, status: "approved" },
      { new: true },
    ).populate("component")

    if (!review) {
      return res.status(404).json({ error: { message: "Review not found" } })
    }

    // Update component rating if needed
    if (review.component) {
      await review.component.updateRating()
    }

    res.json({ message: "Review approved successfully", review })
  } catch (error) {
    next(error)
  }
})
router.put("/reviews/:id/flag", async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: false, status: "flagged" },
      { new: true },
    )

    if (!review) {
      return res.status(404).json({ error: { message: "Review not found" } })
    }

    res.json({ message: "Review flagged successfully", review })
  } catch (error) {
    next(error)
  }
})

// Purchase Management
router.get("/purchases", getAllPurchases)

// Bulk Operations
router.put("/users/bulk/:action", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: { message: "Admin access required" } })
    }

    const { action } = req.params
    const { userIds } = req.body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: { message: "User IDs are required" } })
    }

    let updateData = {}

    switch (action) {
      case "suspend":
        updateData = { isActive: false, status: "suspended" }
        break
      case "activate":
        updateData = { isActive: true, status: "active" }
        break
      default:
        return res.status(400).json({ error: { message: "Invalid action" } })
    }

    await User.updateMany(
      { _id: { $in: userIds }, _id: { $ne: req.user.id } }, // Prevent self-action
      updateData,
    )

    res.json({ message: `Successfully ${action}ed ${userIds.length} users` })
  } catch (error) {
    next(error)
  }
})

router.put("/components/bulk/:action", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: { message: "Admin access required" } })
    }

    const { action } = req.params
    const { componentIds } = req.body

    if (!componentIds || !Array.isArray(componentIds) || componentIds.length === 0) {
      return res.status(400).json({ error: { message: "Component IDs are required" } })
    }

    let updateData = {}

    switch (action) {
      case "approve":
        updateData = { status: "approved", published: true }
        break
      case "reject":
        updateData = { status: "rejected", published: false }
        break
      case "feature":
        updateData = { featured: true }
        break
      case "unfeature":
        updateData = { featured: false }
        break
      default:
        return res.status(400).json({ error: { message: "Invalid action" } })
    }

    await Component.updateMany({ _id: { $in: componentIds } }, updateData)

    res.json({ message: `Successfully ${action}ed ${componentIds.length} components` })
  } catch (error) {
    next(error)
  }
})

// System Settings
router.get("/settings", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: { message: "Admin access required" } })
    }

    // Return default system settings (can be stored in database later)
    const settings = {
      commissionRate: 10,
      maxFileSize: 50,
      emailNotifications: {
        newUserRegistrations: true,
        componentSubmissions: true,
        dailyReports: false,
      },
      platformSettings: {
        maintenanceMode: false,
        allowRegistrations: true,
        requireEmailVerification: true,
      },
    }

    res.json(settings)
  } catch (error) {
    next(error)
  }
})

router.put("/settings", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: { message: "Admin access required" } })
    }


    const updatedSettings = req.body

    res.json({
      message: "Settings updated successfully",
      settings: updatedSettings,
    })
  } catch (error) {
    next(error)
  }
})

// Logout
router.post("/logout", async (req, res, next) => {
  try {
    res.json({ message: "Logged out successfully" })
  } catch (error) {
    next(error)
  }
})

// Verify admin token
router.get("/verify", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: { message: "No token provided", code: "NO_TOKEN" },
      })
    }

    const token = authHeader.split(" ")[1]

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const admin = await User.findById(decoded.id).select("-password -refreshTokens")

    if (!admin || admin.role !== "admin" || !admin.isActive) {
      return res.status(401).json({
        error: { message: "Invalid token or admin not active", code: "INVALID_TOKEN" },
      })
    }

    res.json({ admin }) // return admin info
  } catch (error) {
    return res.status(401).json({ error: { message: "Token verification failed", code: "INVALID_TOKEN" } })
  }
})


export default router
