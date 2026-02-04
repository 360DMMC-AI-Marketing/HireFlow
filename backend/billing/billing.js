import { Router } from "express";
const router = Router();

router.get('/api/billing/subscriptions', (req, res) => {
    res.send('Billing Subscriptions API is working');
}   );
router.get('/api/billing/plans', (req, res) => {
    res.send('Billing Plans API is working');
}   );
router.post('/api/billing/upgrade', (req, res) => {
    res.send('Billing Upgrade API is working');
}   );  
router.post('/api/billing/downgrade', (req, res) => {
    res.send('Billing Downgrade API is working');
}   );
router.post('/api/billing/update-payment-method', (req, res) => {
    res.send('Billing Update Payment Method API is working');
}   );

router.get('/api/billing/invoices', (req, res) => {
    res.send('Billing Invoices API is working');
}   );
export default router;