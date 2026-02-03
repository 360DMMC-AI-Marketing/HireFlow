import { Router } from "express";
const router = Router();
router.get('/api/interview/:token/verify    ', (req, res) => {
    res.send('Interview Verify API is working');
}   );
router.post('/api/interview/:token/tech-check-complete  ', (req, res) => {
    res.send('Interview Start API is working');
}   );
router.post('/api/interview/:token/live  ', (req, res) => {
    res.send('Interview Complete API is working');
}   );
router.post('/api/interview/:token/start  ', (req, res) => {
    res.send('Interview Tech Check Complete API is working');
    }   );
router.post('/api/interview/:token/answer', (req, res) => {
    res.send('Interview Answer API is working');
    }   );
router.post('/api/interview/:token/upload-chunck', (req, res) =>{
    res.send('Interview Upload Chunk API is working');  
}   );  
router.get('/api/interview/:token/complete', (req, res) => {
    res.send('Interview Complete API is working');
}   );
router.get('/api/interview/:token/questions', (req, res) => {
    res.send('Interview Status API is working');
}   );
router.post('/api/interview/:token/attention-data', (req, res) => {
    res.send('Interview Submit API is working');
}   );
router.post('/api/interview/:token/qa-question', (req, res) => {
    res.send('Interview QA Question API is working');
}   );

router.post('/api/interview/:token/complete', (req, res) => {
    res.send('Interview Submit API is working');
}   );
export default router;