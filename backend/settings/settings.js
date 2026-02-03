import { Router } from "express";  
const router = Router();
router.get('/api/settings/integrations', (req, res) => {
    res.send('Settings API is working');
}   );
router.post('/api/settings/integrations/linkedin/connect', (req, res) => {
    res.send('Connect Integration API is working');
}   );  
router.post('/api/settings/integrations/linkedin/disconnect', (req, res) => {
    res.send('Disconnect Integration API is working');
}   );
router.post('/api/settings/integrations/indeed/connect', (req, res) => {
    res.send('Connect Indeed Integration API is working');
}   );
router.post('/api/settings/integrations/google/connect', (req, res) => {
    res.send('Connect Google Integration API is working');
}   );
router.post('/api/settings/integrations/zoom/connect', (req, res) => {
    res.send('Connect Zoom Integration API is working');
}   );
router.post('/api/settings/integrations/teams/connect', (req, res) => {
    res.send('Connect Teams Integration API is working');
}   );
router.post('/api/settings/integrations/:platform/status', (req, res) => {
    res.send('Connect Slack Integration API is working');
}   );
export default router;