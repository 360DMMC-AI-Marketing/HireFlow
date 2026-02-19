import { Router } from "express";
import '../config/passport.js';  // Execute config on startup
import { 
    signup, 
    verifyEmail, 
    login, 
    forgotPassword,
    verifyResetCode,
    resetPassword, 
    getMe, 
    logout,
    refreshAccessToken 
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Public routes
router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password/:token", resetPassword);
router.post("/refresh-token", refreshAccessToken);

// Protected routes
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

// Google Calendar OAuth is handled via /api/integrations/google to avoid duplicate routes

export default router;