import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import {
  applyForJob,
  getAllCandidates,
  getCandidateById,
  getResume,
  createCandidate,
  updateCandidateStatus,
  bulkUpdateCandidates,
  bulkDeleteCandidates,
  deleteCandidate
} from '../controllers/candidateController.js';

const router = Router();

// ─── Multer config (stays in routes – middleware concern) ────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'assets/uploads/resumes/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
  }
});

// ─── PUBLIC ──────────────────────────────────────────────────────────────────
router.post('/apply', (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      console.error('📎 File upload error:', err.message);
      return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
    }
    next();
  });
}, applyForJob);

// ─── PROTECTED ───────────────────────────────────────────────────────────────
router.use(protect);

router.get('/',          authorize('admin', 'recruiter', 'hiring_manager'), getAllCandidates);
router.get('/:id',       authorize('admin', 'recruiter', 'hiring_manager'), getCandidateById);
router.get('/:id/resume', authorize('admin', 'recruiter', 'hiring_manager'), getResume);

router.post('/',         authorize('admin', 'recruiter'), createCandidate);

router.patch('/bulk-updates', authorize('admin', 'recruiter'), bulkUpdateCandidates);
router.patch('/:id/status',  authorize('admin', 'recruiter'), updateCandidateStatus);

router.delete('/bulk',   authorize('admin', 'recruiter'), bulkDeleteCandidates);
router.delete('/:id',    authorize('admin', 'recruiter'), deleteCandidate);

export default router;
