import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getUserProfile, updateUserProfile } from "../controllers/usercontroller.js";

const router = Router();
router.get('/', (req, res) => {
    res.send('User API is working');
});

router.get('/profile', protect, getUserProfile);

router.get('/tier', (req, res) =>    {
    res.send('User settings endpoint');
});
router.post('/filter-presets', (req, res) =>    {
    res.send('Update user filter presets endpoint');
}   );
router.get('/filter-presets', (req, res) =>    {
    res.send('Get user filter presets endpoint');
}   );
router.delete('/filter-presets/:id', (req, res) =>    {
    res.send('Delete user filter preset endpoint');
}   );  
router.put('/profile', protect, updateUserProfile);  
router.put('/password', (req, res) =>{  
    res.send('Update user password endpoint');
}   );
router.post('/onboarding-complete', (req, res) => {
    res.send('User onboarding complete endpoint');
}   );


export default router;