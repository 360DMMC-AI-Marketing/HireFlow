import { Router } from "express";
const router = Router();


router.post("/api/auth/signup", (req, res) => {
    res.send('Register endpoint');
}   );
router.post("/api/auth/verify-email", (req, res) => {
    res.send('Email verification endpoint');
}   );



router.post("/api/auth/login", (req, res) => { 
    res.send('Login endpoint');

});
router.post("/api/auth/forgot-password", (req, res) => {
    res.send('Forgot password endpoint');
});
router.post("/api/auth/reset-password", (req, res) => {
    res.send('Reset password endpoint');
});
router.get("/api/auth/me", (req, res) => {
    res.send('Get current user endpoint');
}   );
router.post("/api/auth/logout", (req, res) => {
    res.send('Logout endpoint');
    
}   );


export default router;