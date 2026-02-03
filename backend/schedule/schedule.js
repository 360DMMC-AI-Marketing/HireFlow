import {Router} from 'express';
const router = Router();

router.get('/api/schedule/:token', (req, res) => {
    res.send('Schedule API is working');
});
router.post('/api/schedule/:token/book', (req, res) => {
    res.send('Schedule POST API is working');
}   );  
router.get('/api/schedule/:token/current', (req, res) => {
    res.send('Schedule availability API is working');
}   );
router.patch('/api/schedule/:token/resechedule', (req, res) => {
    res.send('Schedule unavailable API is working');
}   );

export default router;