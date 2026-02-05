import { Router } from 'express';
import {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  updateJobStatus,
  deleteJob,
  duplicateJob,
  validateSlug,
  getJobAnalytics,
  saveDraft,
  generateDescription
} from '../controllers/jobController.js';

const router = Router();

// Job CRUD operations
router.get('/', getAllJobs);
router.post('/', createJob);
router.get('/:id', getJobById);
router.patch('/:id', updateJob);
router.delete('/:id', deleteJob);

// Job status management
router.patch('/:id/status', updateJobStatus);

// Job operations
router.post('/:id/duplicate', duplicateJob);
router.get('/:id/analytics', getJobAnalytics);

// Draft and AI features
router.post('/draft', saveDraft);
router.post('/generate-description', generateDescription);
router.post('/validate-slug', validateSlug);

export default router;