import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js'; // Import middleware
import {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  updateJobStatus,
  deleteJob,
  // ... other imports
} from '../controllers/jobController.js';

const router = Router();

// 1. Apply 'protect' to everything below this line
router.use(protect); 

// Everyone can view jobs
router.get('/', getAllJobs);
router.get('/:id', getJobById);

// Only Admin & Recruiter can CREATE or EDIT jobs
router.post('/', authorize('admin', 'recruiter'), createJob);
router.patch('/:id', authorize('admin', 'recruiter'), updateJob);
router.delete('/:id', authorize('admin', 'recruiter'), deleteJob);
router.patch('/:id/status', authorize('admin', 'recruiter'), updateJobStatus);

// ... apply similar logic to other routes if needed
export default router;