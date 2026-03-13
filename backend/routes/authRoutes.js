import express from "express"
import { register, login, googleAuth, getMe, refreshToken, logout, updateProfile } from "../controllers/authController.js"
import { protect } from "../middleware/auth.js"
import { validateRegister, validateLogin } from "../middleware/validation.js"

const router = express.Router()

router.post("/register", validateRegister, register)
router.post("/login", login)//, validateLogin
router.post("/google", googleAuth)
router.get("/me", protect, getMe)
router.put("/profile", protect, updateProfile)
router.post("/refresh", refreshToken)
router.post("/logout", protect, logout)

export default router
