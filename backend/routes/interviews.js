// backend/routes/interviews.js
import { Router } from "express";
import { protect, authorize } from '../middleware/auth.js';

// IMPORTANT: This imports all exports from the file as an object named 'interviewController'
import * as interviewController from '../controllers/interviewController.js'; 

const router = Router();

// ... existing code ...

// CHECK THIS SECTION:
// Ensure interviewController.getSlots is actually being called
router.get('/slots', interviewController.getSlots); 
router.post('/book', interviewController.bookSlot);
router.post('/slots', protect, authorize('admin', 'recruiter'), interviewController.createSlots);
// ==========================================
//  PART 2: LIVE INTERVIEW ROUTES (Existing)
// ==========================================

router.get('/:token/verify', (req, res) => {
    res.send('Interview Verify API is working');
});

router.post('/:token/tech-check-complete', (req, res) => {
    res.send('Interview Tech Check Complete API is working');
});

router.post('/:token/start', (req, res) => {
    res.send('Interview Start API is working');
});

router.post('/:token/live', (req, res) => {
    res.send('Interview Live API is working');
});

router.post('/:token/answer', (req, res) => {
    res.send('Interview Answer API is working');
});

router.post('/:token/upload-chunk', (req, res) => {
    res.send('Interview Upload Chunk API is working');  
});  

router.get('/:token/questions', (req, res) => {
    res.send('Interview Questions API is working');
});

router.post('/:token/attention-data', (req, res) => {
    res.send('Interview Attention Data API is working');
});

router.post('/:token/qa-question', (req, res) => {
    res.send('Interview QA Question API is working');
});

router.post('/:token/complete', (req, res) => {
    res.send('Interview Complete API is working');
});

export default router;