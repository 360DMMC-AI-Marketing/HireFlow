import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Try to load BullMQ queue (optional)
let resumeQueue = null;
try {
  const { Queue } = await import('bullmq');
  resumeQueue = new Queue('resume-processing', {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379
    }
  });
  // Test the connection immediately
  await resumeQueue.getJobCounts();
  console.log('✅ Connected to Redis for resume processing queue');
} catch (error) {
  console.warn('⚠️  Redis/BullMQ not available:', error.message);
  console.warn('   AI resume processing will run inline (synchronously).');
  resumeQueue = null;
}

// Inline resume processing function (fallback when Redis/BullMQ not available)
async function processResumeInline(candidateId, filePath, fileName, mimeType, jobId) {
  try {
    const { promises: fs } = await import('fs');
    const { extractText } = await import('../utils/textExtractor.js');
    const { analyzeResume } = await import('../utils/aiService.js');
    const { default: Candidate } = await import('../models/candidate.js');
    
    // 1. Read file
    const backendDir = path.resolve(__dirname, '..');
    const absolutePath = path.resolve(backendDir, filePath);
    console.log(`📄 [Inline] Reading file: ${absolutePath}`);
    const fileBuffer = await fs.readFile(absolutePath);

    // 2. Extract text
    console.log(`🔍 [Inline] Extracting text from ${fileName}...`);
    const rawText = await extractText(fileBuffer, mimeType);
    console.log(`✅ [Inline] Extracted ${rawText.length} characters`);

    if (!rawText || rawText.length < 20) {
      console.warn('⚠️  [Inline] Extracted text too short, skipping AI analysis');
      await Candidate.findByIdAndUpdate(candidateId, { processingStatus: 'Failed', resumeText: rawText });
      return;
    }

    // 3. Fetch job description
    let jobDescription = "General position";
    if (jobId) {
      try {
        const { default: Job } = await import('../models/job.js');
        const job = await Job.findById(jobId);
        if (job) {
          const reqs = Array.isArray(job.requirements) ? job.requirements.join('\n- ') : (job.requirements || 'Not specified');
          const skills = job.screeningCriteria?.requiredSkills?.join(', ') || '';
          jobDescription = `${job.title}\n\n${job.description}\n\nRequirements:\n- ${reqs}${skills ? `\n\nRequired Skills: ${skills}` : ''}${job.screeningCriteria?.minYearsExperience ? `\nMinimum Experience: ${job.screeningCriteria.minYearsExperience} years` : ''}`;
          console.log(`📌 [Inline] Job found: ${job.title}`);
        }
      } catch (e) {
        console.warn(`⚠️  [Inline] Could not fetch job: ${e.message}`);
      }
    }

    // 4. AI Analysis
    console.log(`🤖 [Inline] Analyzing resume with AI...`);
    const aiData = await analyzeResume(rawText, jobDescription);
    console.log(`✅ [Inline] AI Analysis complete - Match Score: ${aiData.matchScore}%`);

    // 5. Update candidate
    const updateData = {
      resumeText: rawText,
      processingStatus: 'Completed',
      status: 'Screening',
      matchScore: aiData.matchScore || 0,
      skills: aiData.skills || [],
      experience: aiData.experience || [],
      redFlags: aiData.redFlags || [],
    };
    if (aiData.name && aiData.name !== 'Unknown') updateData.name = aiData.name;
    if (aiData.phone) updateData.phone = aiData.phone;
    if (aiData.summary) updateData.summary = aiData.summary;
    
    // Only update email if it won't cause duplicate key conflict
    if (aiData.email && !aiData.email.includes('placeholder')) {
      const existing = await Candidate.findOne({ email: aiData.email, jobId, _id: { $ne: candidateId } });
      if (!existing) updateData.email = aiData.email;
    }

    try {
      await Candidate.findByIdAndUpdate(candidateId, updateData);
    } catch (updateErr) {
      if (updateErr.code === 11000) {
        delete updateData.email;
        await Candidate.findByIdAndUpdate(candidateId, updateData);
      } else throw updateErr;
    }
    console.log(`✅ [Inline] Candidate ${candidateId} updated with score: ${updateData.matchScore}%`);
  } catch (error) {
    console.error(`❌ [Inline] Processing failed:`, error.message);
    try {
      const { default: Candidate } = await import('../models/candidate.js');
      await Candidate.findByIdAndUpdate(candidateId, { processingStatus: 'Failed' });
    } catch (e) { /* ignore */ }
  }
}

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
router.post('/apply', (req, res, next) => {
    // Wrap multer to catch file upload errors gracefully
    upload.single('resume')(req, res, (err) => {
        if (err) {
            console.error('📎 File upload error:', err.message);
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload failed'
            });
        }
        next();
    });
}, async (req, res) => {
    console.log('📝 Received application submission');
    
    try {
        const { name, email, phone, location, linkedIn, coverLetter, jobId, positionApplied, source } = req.body;
        
        // Import Candidate model dynamically
        const { default: Candidate } = await import('../models/candidate.js');
        
        const candidateData = {
            name: name || 'Unknown',
            email: email || `candidate_${Date.now()}@placeholder.com`,
            phone: phone || '',
            location: location || '',
            linkedIn: linkedIn || '',
            summary: coverLetter || '',
            positionApplied: positionApplied || 'General Application',
            source: source || 'HireFlow Direct',
            status: 'New',
            matchScore: 0,
            appliedDate: new Date(),
            resumePath: req.file ? req.file.path : null,
            resumeFileName: req.file ? req.file.originalname : null
        };

        // Only add jobId if it's provided and valid
        if (jobId && jobId !== 'undefined' && jobId !== 'null') {
            candidateData.jobId = jobId;
        }

        let candidate;
        try {
            candidate = await Candidate.create(candidateData);
        } catch (createErr) {
            // Handle duplicate application (same email + same job)
            if (createErr.code === 11000) {
                console.warn('⚠️  Duplicate application detected:', email, 'for job', jobId);
                return res.status(409).json({
                    success: false,
                    message: 'You have already applied for this position with this email address.'
                });
            }
            // Handle validation errors
            if (createErr.name === 'ValidationError') {
                const messages = Object.values(createErr.errors).map(e => e.message);
                return res.status(400).json({
                    success: false,
                    message: messages.join(', ')
                });
            }
            throw createErr;
        }
        
        // Trigger AI processing if resume is uploaded
        if (req.file && jobId) {
          let queued = false;
          
          // Try BullMQ queue first (async background processing)
          if (resumeQueue) {
            try {
              await resumeQueue.add('process-resume', {
                candidateId: candidate._id.toString(),
                filePath: req.file.path,
                fileName: req.file.originalname,
                mimeType: req.file.mimetype,
                jobId: jobId
              });
              console.log(`✅ Resume processing job added to queue for candidate: ${candidate._id}`);
              queued = true;
            } catch (queueError) {
              console.warn('⚠️  Queue failed, falling back to inline processing:', queueError.message);
            }
          }
          
          // Fallback: process inline if queue not available
          if (!queued) {
            console.log('🔄 Processing resume inline (no queue)...');
            // Fire-and-forget inline processing so the response isn't delayed
            processResumeInline(candidate._id.toString(), req.file.path, req.file.originalname, req.file.mimetype, jobId)
              .then(() => console.log(`✅ Inline resume processing complete for ${candidate._id}`))
              .catch(err => console.error(`❌ Inline processing failed:`, err.message));
          }
        }
        
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

// GET resume file for a candidate (download or inline view)
router.get('/:id/resume', authorize('admin', 'recruiter', 'hiring_manager'), async (req, res) => {
    try {
        const { default: Candidate } = await import('../models/candidate.js');
        const { promises: fs } = await import('fs');
        
        const candidate = await Candidate.findById(req.params.id);
        
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }
        
        if (!candidate.resumePath) {
            return res.status(404).json({ success: false, message: 'No resume on file for this candidate' });
        }
        
        const backendDir = path.resolve(__dirname, '..');
        const absolutePath = path.resolve(backendDir, candidate.resumePath);
        
        // Verify file exists
        try {
            await fs.access(absolutePath);
        } catch {
            return res.status(404).json({ success: false, message: 'Resume file not found on disk' });
        }
        
        const ext = path.extname(candidate.resumeFileName || candidate.resumePath).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        // If ?download=true, force download; otherwise inline display
        const disposition = req.query.download === 'true' 
            ? `attachment; filename="${candidate.resumeFileName || 'resume' + ext}"` 
            : `inline; filename="${candidate.resumeFileName || 'resume' + ext}"`;
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', disposition);
        // Allow iframe embedding and cross-origin access for the resume viewer
        res.setHeader('X-Frame-Options', 'ALLOWALL');
        res.removeHeader('Content-Security-Policy');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        
        const { createReadStream } = await import('fs');
        createReadStream(absolutePath).pipe(res);
    } catch (error) {
        console.error('Error serving resume:', error);
        res.status(500).json({ success: false, message: 'Error serving resume', error: error.message });
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

router.patch('/bulk-updates', authorize('admin', 'recruiter'), async (req, res) => {
    try {
        const { ids, updates } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'No candidate IDs provided' });
        }
        const { default: Candidate } = await import('../models/candidate.js');
        const result = await Candidate.updateMany(
            { _id: { $in: ids } },
            { $set: updates }
        );
        res.json({
            success: true,
            message: `${result.modifiedCount} candidates updated successfully`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error bulk updating candidates:', error);
        res.status(500).json({ success: false, message: 'Error updating candidates', error: error.message });
    }
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

router.patch('/:id/status', authorize('admin', 'recruiter'), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'Applied'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
        const { default: Candidate } = await import('../models/candidate.js');
        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }
        res.json({ success: true, candidate });
    } catch (error) {
        console.error('Error updating candidate status:', error);
        res.status(500).json({ success: false, message: 'Error updating status', error: error.message });
    }
});

// ... rest of your routes

export default router;