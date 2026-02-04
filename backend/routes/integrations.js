import { Router } from "express";
const router = Router();

router.get('/api/integrations/status', (req, res) => {
    res.send('API is working');
});

export default router;