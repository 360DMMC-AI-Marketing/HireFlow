import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/aiInterviewController.js';

const router = Router();

// ── Public: candidate joins via magic link (no auth) ──
router.get('/join/:magicToken', ctrl.joinViaMagicToken);

// ── Protected routes ──
router.use(protect);

// Create & manage AI interview sessions
router.post('/',
  authorize('admin', 'recruiter'),
  ctrl.createSession
);
router.get('/job/:jobId',
  authorize('admin', 'recruiter', 'hiring_manager'),
  ctrl.getSessionsByJob
);
router.get('/candidate/:candidateId',
  authorize('admin', 'recruiter', 'hiring_manager'),
  ctrl.getSessionsByCandidate
);
router.get('/:id',
  authorize('admin', 'recruiter', 'hiring_manager'),
  ctrl.getSession
);
router.delete('/:id',
  authorize('admin'),
  ctrl.deleteSession
);

// Magic link
router.post('/:id/magic-link',
  authorize('admin', 'recruiter'),
  ctrl.generateMagicLink
);

// Analysis endpoints (only available after interview is completed)
router.get('/:id/analysis',
  authorize('admin', 'recruiter', 'hiring_manager'),
  ctrl.getAnalysis
);
router.get('/:id/comparison',
  authorize('admin', 'recruiter', 'hiring_manager'),
  ctrl.getResumeComparison
);
router.get('/job/:jobId/rankings',
  authorize('admin', 'recruiter', 'hiring_manager'),
  ctrl.getCandidateRankings
);

// Question bank management
router.get('/questions/bank',
  authorize('admin', 'recruiter'),
  ctrl.getQuestionBank
);
router.post('/questions/bank',
  authorize('admin', 'recruiter'),
  ctrl.createQuestion
);
router.put('/questions/bank/:questionId',
  authorize('admin', 'recruiter'),
  ctrl.updateQuestion
);
router.delete('/questions/bank/:questionId',
  authorize('admin', 'recruiter'),
  ctrl.deleteQuestion
);

export default router;