import { Router } from 'express';
const router = Router();

router.get('/api/question-banks', (req, res) => {
	res.send('Question banks endpoint');
});

export default router;