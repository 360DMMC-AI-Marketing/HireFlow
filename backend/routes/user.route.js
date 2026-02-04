import { Router } from "express";
const router = Router();
router.get('/', (req, res) => {
    res.send('API is working');
});

router.get('/api/user/profile', (req, res) =>    {
    res.send('User profile endpoint');
});

router.get('/api/user/tier', (req, res) =>    {
    res.send('User settings endpoint');
});
router.post('/api/user/filter-presets', (req, res) =>    {
    res.send('Update user filter presets endpoint');
}   );
router.get('/api/user/filter-presets', (req, res) =>    {
    res.send('Get user filter presets endpoint');
}   );
router.delete('/api/user/filter-presets/:id', (req, res) =>    {
    res.send('Delete user filter preset endpoint');
}   );  
router.get('/api/user/profile', (req, res) =>{
    res.send('Get user profile endpoint');
}   );  
router.put('/api/user/profile', (req, res) =>{  
    res.send('Update user profile endpoint');
}   );  
router.put('/api/user/password', (req, res) =>{  
    res.send('Update user password endpoint');
}   );
router.post('/api/user/onboarding-complete', (req, res) => {
    res.send('User onboarding complete endpoint');
}   );


export default router;