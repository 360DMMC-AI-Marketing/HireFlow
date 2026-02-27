import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { protect, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/aiInterviewController.js';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const protectOrInterviewToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.isInterviewToken) {
      req.user = { id: decoded.id, role: 'candidate', sessionId: decoded.sessionId };
    } else {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(401).json({ message: 'User not found' });
      req.user = user;
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const recordingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'assets', 'uploads', 'recordings'));
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop() || 'webm';
    cb(null, `interview-${req.params.id}-${Date.now()}.${ext}`);
  }
});

const uploadRecording = multer({
  storage: recordingStorage,
  limits: { fileSize: 500 * 1024 * 1024 }
});

const router = Router();

// Public
router.get('/join/:magicToken', ctrl.joinViaMagicToken);

// Recording upload - before protect middleware
router.post('/:id/recording', protectOrInterviewToken, uploadRecording.single('recording'), ctrl.saveRecording);

// Protected routes
router.use(protect);

router.post('/', authorize('admin', 'recruiter'), ctrl.createSession);
router.get('/job/:jobId', authorize('admin', 'recruiter', 'hiring_manager'), ctrl.getSessionsByJob);
router.get('/candidate/:candidateId', authorize('admin', 'recruiter', 'hiring_manager'), ctrl.getSessionsByCandidate);
router.get('/:id', authorize('admin', 'recruiter', 'hiring_manager'), ctrl.getSession);
router.delete('/:id', authorize('admin', 'recruiter'), ctrl.deleteSession);
router.post('/:id/magic-link', authorize('admin', 'recruiter'), ctrl.generateMagicLink);
router.get('/:id/analysis', authorize('admin', 'recruiter', 'hiring_manager'), ctrl.getAnalysis);
router.get('/:id/comparison', authorize('admin', 'recruiter', 'hiring_manager'), ctrl.getResumeComparison);
router.get('/job/:jobId/rankings', authorize('admin', 'recruiter', 'hiring_manager'), ctrl.getCandidateRankings);
router.get('/questions/bank', authorize('admin', 'recruiter'), ctrl.getQuestionBank);
router.post('/questions/bank', authorize('admin', 'recruiter'), ctrl.createQuestion);
router.put('/questions/bank/:questionId', authorize('admin', 'recruiter'), ctrl.updateQuestion);

export default router;