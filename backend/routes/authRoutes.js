import { Router } from "express";
import { 
    signup, 
    verifyEmail, 
    login, 
    forgotPassword,
    verifyResetCode,
    resetPassword, 
    getMe, 
    logout 
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

// Protected routes
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

export default router;