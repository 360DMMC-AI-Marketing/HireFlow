import { Router } from "express";
const router = Router();
router.get('/api/email-templates', (req, res) => {
    res.send('Email Templates API is working');
}   );

router.get('/api/email-templates/:id', (req, res) => {
    res.send('Get Email Template by ID API is working');
}   );
router.put('/api/email-templates/:id', (req, res) => {
    res.send('Update Email Template by ID API is working');
}   );
router.post('/api/email-templates/:id/test', (req, res) => {
    res.send('Test Email Template by ID API is working');
}   );
router.post('/api/email-templates/:id/test', (req, res) => {
    res.send('Send Email Template by ID API is working');
}   );
export default router;