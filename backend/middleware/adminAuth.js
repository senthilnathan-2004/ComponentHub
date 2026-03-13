// Middleware to check if user is admin
import jwt from "jsonwebtoken"
import User from "../models/User.js"

export const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: {
          message: "Authentication token required",
          code: "AUTHENTICATION_REQUIRED",
        },
      })
    }

    const token = authHeader.split(" ")[1]
    if (!token) {
      return res.status(401).json({
        error: {
          message: "Authentication token required",
          code: "AUTHENTICATION_REQUIRED",
        },
      })
    }

    // Verify token and get user
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)

      if (!user || !user.isActive) {
        return res.status(401).json({
          error: {
            message: "Invalid or inactive user",
            code: "INVALID_USER",
          },
        })
      }

      if (user.role !== "admin") {
        return res.status(403).json({
          error: {
            message: "Admin access required",
            code: "ADMIN_ACCESS_REQUIRED",
          },
        })
      }

      req.user = user
      next()
    } catch (tokenError) {
      return res.status(401).json({
        error: {
          message: "Invalid authentication token",
          code: "INVALID_TOKEN",
        },
      })
    }
  } catch (error) {
    next(error)
  }
}

// Middleware to check if user can moderate content
export const canModerate = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        },
      })
    }

    const allowedRoles = ["admin", "moderator"]
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: "Moderation privileges required",
          code: "MODERATION_REQUIRED",
        },
      })
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Middleware to log admin actions
export const logAdminAction = (action) => {
  return (req, res, next) => {
    const originalSend = res.send

    res.send = function (data) {
      // Log successful admin actions
      if (res.statusCode < 400) {
        console.log(`Admin Action: ${action}`, {
          adminId: req.user.id,
          adminEmail: req.user.email,
          action,
          targetId: req.params.id,
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        })
      }

      originalSend.call(this, data)
    }

    next()
  }
}

export default requireAdmin
