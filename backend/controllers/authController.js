import User from "../models/User.js"
import jwt from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        error: {
          message: "User already exists with this email",
          code: "USER_EXISTS",
        },
      })
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "buyer",
    })

    sendTokenResponse(user, 201, res)
  } catch (error) {
    next(error)
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: "Please provide an email and password",
          code: "MISSING_CREDENTIALS",
        },
      })
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password")

    if (!user) {
      return res.status(401).json({
        error: {
          message: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        },
      })
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password)

    if (!isMatch) {
      return res.status(401).json({
        error: {
          message: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        },
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    sendTokenResponse(user, 200, res)
  } catch (error) {
    next(error)
  }
}

// @desc    Google OAuth login
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({
        error: {
          message: "Google ID token is required",
          code: "MISSING_TOKEN",
        },
      })
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const { sub: googleId, email, name, picture } = payload

    // Check if user exists
    let user = await User.findOne({ $or: [{ googleId }, { email }] })

    if (user) {
      // Update Google ID if user exists with email but no Google ID
      if (!user.googleId) {
        user.googleId = googleId
        await user.save()
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        isEmailVerified: true,
        role: "buyer",
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    sendTokenResponse(user, 200, res)
  } catch (error) {
    next(error)
  }
}

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      website: user.website,
      location: user.location,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    })
  } catch (error) {
    next(error)
  }
}


// @desc    Update current user's profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    // Only allow specific fields to be updated
    const allowedUpdates = ["name", "avatar", "bio", "website", "location"]
    const updates = {}

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key]
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,       // return updated document
      runValidators: true, // validate fields against schema
    }).select("-password -refreshTokens") // don’t expose sensitive fields

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      website: user.website,
      location: user.location,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  } catch (error) {
    next(error)
  }
}


// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies

    if (!refreshToken) {
      return res.status(401).json({
        error: {
          message: "Refresh token not found",
          code: "NO_REFRESH_TOKEN",
        },
      })
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
      const user = await User.findById(decoded.id)

      if (!user) {
        return res.status(401).json({
          error: {
            message: "Invalid refresh token",
            code: "INVALID_REFRESH_TOKEN",
          },
        })
      }

      // Check if refresh token exists in user's tokens
      const tokenExists = user.refreshTokens.some((t) => t.token === refreshToken)
      if (!tokenExists) {
        return res.status(401).json({
          error: {
            message: "Invalid refresh token",
            code: "INVALID_REFRESH_TOKEN",
          },
        })
      }

      // Remove old refresh token and generate new tokens
      await user.removeRefreshToken(refreshToken)
      sendTokenResponse(user, 200, res)
    } catch (error) {
      return res.status(401).json({
        error: {
          message: "Invalid refresh token",
          code: "INVALID_REFRESH_TOKEN",
        },
      })
    }
  } catch (error) {
    next(error)
  }
}

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies

    if (refreshToken) {
      const user = await User.findById(req.user.id)
      if (user) {
        await user.removeRefreshToken(refreshToken)
      }
    }

    res.cookie("refreshToken", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    })

    res.status(200).json({
      message: "User logged out successfully",
    })
  } catch (error) {
    next(error)
  }
}

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = async (user, statusCode, res) => {
  // Create token
  const accessToken = user.getSignedJwtToken()
  const refreshToken = user.getRefreshToken()

  // Add refresh token to user
  await user.addRefreshToken(refreshToken)

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  }

  res
    .status(statusCode)
    .cookie("refreshToken", refreshToken, options)
    .json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    })
}
