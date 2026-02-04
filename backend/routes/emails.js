import { Router } from "express";
const router = Router();   
router.get('/api/emails', (req, res) => {
    res.send('Emails API is working');
}   );
router.get('/api/emails/:id', (req, res) => {
    res.send('Get Email by ID API is working');
}   );
router.post('/api/emails/:id/resend', (req, res) => {
    res.send('Send Email API is working');
}   );

export default router;