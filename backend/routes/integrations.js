import { Router } from "express";
import passport from "passport";

const router = Router();

// Test Route
router.get('/status', (req, res) => {
    res.send('Integrations API is working');
});

// --- GOOGLE ROUTES ---

// 1. Trigger Google OAuth
// accessType: 'offline' and prompt: 'consent' are REQUIRED to force Google to give us a refresh token
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'], // Add Google APIs you need here
    accessType: 'offline',
    prompt: 'consent' 
}));

// 2. Google Callback Route
router.get('/google/callback', 
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/dashboard/settings?error=oauth_failed` }), 
    (req, res) => {
        // Successful authentication, redirect back to frontend
        res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?integration=google_success`);
    }
);


// --- LINKEDIN ROUTES ---

// 1. Trigger LinkedIn OAuth
router.get('/linkedin', passport.authenticate('linkedin'));

// 2. LinkedIn Callback Route
router.get('/linkedin/callback', 
    passport.authenticate('linkedin', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/dashboard/settings?error=oauth_failed` }), 
    (req, res) => {
        // Successful authentication, redirect back to frontend
        res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?integration=linkedin_success`);
    }
);
router.get('/indeed', passport.authenticate('indeed'));

// 2. Indeed Callback Route
router.get('/indeed/callback', 
    passport.authenticate('indeed', { 
        session: false, 
        failureRedirect: `${process.env.FRONTEND_URL}/dashboard/settings?error=oauth_failed` 
    }), 
    (req, res) => {
        // If you use JWTs, you would generate one here:
        // const token = generateToken(req.user); 
        // res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?token=${token}&integration=indeed_success`);

        res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?integration=indeed_success`);
    }
);

export default router;