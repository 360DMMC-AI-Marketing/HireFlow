import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  updateJobStatus,
  deleteJob,
} from '../controllers/jobController.js';
import {
  distributeJob,
  postToLinkedIn,
  removeFromLinkedIn,
  postToIndeed,
  removeFromIndeed,
  getDistributionStatus,
  getIndeedFeed
} from '../controllers/jobDistributionController.js';

const router = Router();

// PUBLIC ROUTES - No authentication required
router.get('/', getAllJobs);
router.get('/indeed-feed', getIndeedFeed); // Indeed XML feed (public, crawled by Indeed)
router.get('/:id', getJobById);

// PROTECTED ROUTES - Require authentication
router.use(protect);

// Only Admin & Recruiter can CREATE or EDIT jobs
router.post('/', authorize('admin', 'recruiter'), createJob);
router.patch('/:id', authorize('admin', 'recruiter'), updateJob);
router.delete('/:id', authorize('admin', 'recruiter'), deleteJob);
router.patch('/:id/status', authorize('admin', 'recruiter'), updateJobStatus);

// Distribution routes
router.post('/:id/distribute', authorize('admin', 'recruiter'), distributeJob);
router.post('/:id/distribute/linkedin', authorize('admin', 'recruiter'), postToLinkedIn);
router.delete('/:id/distribute/linkedin', authorize('admin', 'recruiter'), removeFromLinkedIn);
router.post('/:id/distribute/indeed', authorize('admin', 'recruiter'), postToIndeed);
router.delete('/:id/distribute/indeed', authorize('admin', 'recruiter'), removeFromIndeed);
router.get('/:id/distribute/status', authorize('admin', 'recruiter'), getDistributionStatus);

export default router;