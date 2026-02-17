import { Router } from "express";
import passport from 'passport'; // <--- NEW
import '../config/passport.js';  // <--- NEW: Execute config
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

// --- GOOGLE CALENDAR OAUTH ROUTES (NEW) ---
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
  accessType: 'offline', // Crucial for Refresh Token
  prompt: 'consent'      // Force consent to ensure we get the token
}));

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login-failed' }),
  (req, res) => {
    // Successful authentication
    res.send(`
      <h1>Google Calendar Connected!</h1>
      <p>You can close this window and return to the app.</p>
    `);
  }
);
// ------------------------------------------

export default router;