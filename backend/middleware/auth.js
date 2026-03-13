import jwt from "jsonwebtoken"
import User from "../models/User.js"

export const protect = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      return res.status(401).json({
        error: {
          message: "Not authorized to access this route",
          code: "UNAUTHORIZED",
        },
      })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id).select("-password")
      next()
    } catch (error) {
      return res.status(401).json({
        error: {
          message: "Not authorized to access this route",
          code: "UNAUTHORIZED",
        },
      })
    }
  } catch (error) {
    next(error)
  }
}

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: "User role is not authorized to access this route",
          code: "FORBIDDEN",
        },
      })
    }
    next()
  }
}
