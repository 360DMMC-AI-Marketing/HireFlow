import { Router } from "express";
const router = Router();
router.get('/api/company/profile', (req, res) => {
    res.send('Company profile endpoint');
}   );

router.put('/api/company/profile', (req, res) =>{  
    res.send('Update company profile endpoint');
}   );  
router.post('/api/company/logo', (req, res) => {
    res.send('Upload company logo endpoint');
}   );
export default router;