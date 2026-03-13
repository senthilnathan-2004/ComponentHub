import jwt from "jsonwebtoken"
import User from "../models/User.js"

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) return next()

    const token = authHeader.split(" ")[1]
    if (!token) return next()

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select("-password -refreshTokens")
      if (user && user.isActive) {
        req.user = { id: user.id, name: user.name, email: user.email, role: user.role }
      }
    } catch (err) {
     
    }
    return next()
  } catch (err) {
    return next(err)
  }
}

export default optionalAuth
