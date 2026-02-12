import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for resume uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/uploads/resumes/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
        }
    }
});

// PUBLIC ROUTE - Job Application (No auth required)
router.post('/apply', upload.single('resume'), async (req, res) => {
    try {
        const { name, email, phone, location, linkedIn, coverLetter, jobId, positionApplied, source } = req.body;
        
        // Import Candidate model dynamically
        const { default: Candidate } = await import('../models/candidate.js');
        
        const candidateData = {
            name: name || 'Unknown',
            email: email || `candidate_${Date.now()}@placeholder.com`, // Generate unique email if not provided
            phone: phone || '',
            location: location || '',
            linkedIn: linkedIn || '',
            summary: coverLetter || '',
            positionApplied: positionApplied || 'General Application',
            source: source || 'HireFlow Direct',
            status: 'New',
            matchScore: 0, // Will be calculated by AI later
            appliedDate: new Date(),
            resumePath: req.file ? req.file.path : null,
            resumeFileName: req.file ? req.file.originalname : null
        };

        // Only add jobId if it's provided and valid
        if (jobId && jobId !== 'undefined' && jobId !== 'null') {
            candidateData.jobId = jobId;
        }

        const candidate = await Candidate.create(candidateData);
        
        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            candidate: {
                id: candidate._id,
                name: candidate.name,
                email: candidate.email
            }
        });
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting application',
            error: error.message
        });
    }
});

// PROTECTED ROUTES - Require authentication
router.use(protect);

// GET all candidates
router.get('/', authorize('admin', 'recruiter', 'hiring_manager'), async (req, res) => {
    try {
        const { default: Candidate } = await import('../models/candidate.js');
        const candidates = await Candidate.find().sort({ createdAt: -1 });
        res.json(candidates);
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching candidates',
            error: error.message
        });
    }
});

// VIEWING: Allowed for 'admin', 'recruiter', 'hiring_manager'
router.get('/:id', authorize('admin', 'recruiter', 'hiring_manager'), async (req, res) => {
    try {
        const { default: Candidate } = await import('../models/candidate.js');
        const candidate = await Candidate.findById(req.params.id);
        
        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found'
            });
        }
        
        res.json(candidate);
    } catch (error) {
        console.error('Error fetching candidate:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching candidate',
            error: error.message
        });
    }
});

// ACTIONS: Only 'admin' and 'recruiter' can change status or take interview notes
router.post('/', authorize('admin', 'recruiter'), async (req, res) => {
    try {
        const { default: Candidate } = await import('../models/candidate.js');
        const candidate = await Candidate.create(req.body);
        res.status(201).json(candidate);
    } catch (error) {
        console.error('Error creating candidate:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating candidate',
            error: error.message
        });
    }
});

router.patch('/bulk-updates', authorize('admin', 'recruiter'), (req, res) => {
    res.send('Bulk update');
});

router.delete('/bulk', authorize('admin', 'recruiter'), async (req, res) => {
    try {
        const { ids } = req.body;
        const { default: Candidate } = await import('../models/candidate.js');
        await Candidate.deleteMany({ _id: { $in: ids } });
        res.json({
            success: true,
            message: `${ids.length} candidates deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting candidates:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting candidates',
            error: error.message
        });
    }
});

router.patch('/:id/status', authorize('admin', 'recruiter'), (req, res) => {
    res.send('Update status');
});

// ... rest of your routes

export default router;