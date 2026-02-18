import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Candidate from '../models/candidate.js';
import Job from '../models/job.js';
import {
  sendApplicationReceivedEmail,
  sendRejectionEmail
} from '../services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BACKEND_DIR = path.resolve(__dirname, '..');

// ─── Resume Queue (lazy-loaded, shared across handlers) ──────────────────────
let resumeQueue = null;
let queueInitialized = false;

async function getResumeQueue() {
  if (queueInitialized) return resumeQueue;
  queueInitialized = true;
  try {
    const { Queue } = await import('bullmq');
    resumeQueue = new Queue('resume-processing', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379
      }
    });
    await resumeQueue.getJobCounts(); // verify connection
    console.log('✅ [CandidateCtrl] Connected to Redis for resume queue');
  } catch (err) {
    console.warn('⚠️  [CandidateCtrl] Redis/BullMQ not available:', err.message);
    resumeQueue = null;
  }
  return resumeQueue;
}

// ─── Inline Resume Processing (fallback when Redis unavailable) ──────────────
async function processResumeInline(candidateId, filePath, fileName, mimeType, jobId) {
  try {
    const { promises: fs } = await import('fs');
    const { extractText } = await import('../utils/textExtractor.js');
    const { analyzeResume } = await import('../utils/aiService.js');

    // 1. Read file
    const absolutePath = path.resolve(BACKEND_DIR, filePath);
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
    let jobDescription = 'General position';
    if (jobId) {
      try {
        const job = await Job.findById(jobId);
        if (job) {
          const reqs = Array.isArray(job.requirements)
            ? job.requirements.join('\n- ')
            : (job.requirements || 'Not specified');
          const skills = job.screeningCriteria?.requiredSkills?.join(', ') || '';
          jobDescription = `${job.title}\n\n${job.description}\n\nRequirements:\n- ${reqs}${skills ? `\n\nRequired Skills: ${skills}` : ''}${job.screeningCriteria?.minYearsExperience ? `\nMinimum Experience: ${job.screeningCriteria.minYearsExperience} years` : ''}`;
          console.log(`📌 [Inline] Job found: ${job.title}`);
        }
      } catch (e) {
        console.warn(`⚠️  [Inline] Could not fetch job: ${e.message}`);
      }
    }

    // 4. AI Analysis
    console.log('🤖 [Inline] Analyzing resume with AI...');
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

    // Only update email if it won't cause a duplicate-key conflict
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
    console.error('❌ [Inline] Processing failed:', error.message);
    try {
      await Candidate.findByIdAndUpdate(candidateId, { processingStatus: 'Failed' });
    } catch (_) { /* ignore */ }
  }
}

// ─── Helper: try to enqueue or fall back to inline ───────────────────────────
async function triggerResumeProcessing(candidate, file, jobId) {
  const queue = await getResumeQueue();
  let queued = false;

  if (queue) {
    try {
      await queue.add('process-resume', {
        candidateId: candidate._id.toString(),
        filePath: file.path,
        fileName: file.originalname,
        mimeType: file.mimetype,
        jobId
      });
      console.log(`✅ Resume job queued for candidate: ${candidate._id}`);
      queued = true;
    } catch (err) {
      console.warn('⚠️  Queue failed, falling back to inline:', err.message);
    }
  }

  if (!queued) {
    console.log('🔄 Processing resume inline (no queue)...');
    processResumeInline(candidate._id.toString(), file.path, file.originalname, file.mimetype, jobId)
      .then(() => console.log(`✅ Inline resume processing complete for ${candidate._id}`))
      .catch(err => console.error('❌ Inline processing failed:', err.message));
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// CONTROLLERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * PUBLIC — POST /api/candidates/apply
 * Candidates submit applications through the career page (no auth).
 */
export const applyForJob = async (req, res) => {
  console.log('📝 Received application submission');
  try {
    const { name, email, phone, location, linkedIn, coverLetter, jobId, positionApplied, source } = req.body;

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

    if (jobId && jobId !== 'undefined' && jobId !== 'null') {
      candidateData.jobId = jobId;
    }

    // ── Create candidate ──
    let candidate;
    try {
      candidate = await Candidate.create(candidateData);
    } catch (createErr) {
      if (createErr.code === 11000) {
        console.warn('⚠️  Duplicate application:', email, 'for job', jobId);
        return res.status(409).json({
          success: false,
          message: 'You have already applied for this position with this email address.'
        });
      }
      if (createErr.name === 'ValidationError') {
        const messages = Object.values(createErr.errors).map(e => e.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
      }
      throw createErr;
    }

    // ── Email trigger: Application Received ──
    try {
      const job = jobId ? await Job.findById(jobId) : null;
      const jobInfo = job || { title: positionApplied || 'General Application' };
      sendApplicationReceivedEmail(candidate, jobInfo)
        .catch(err => console.error('📧 Application email failed (non-blocking):', err.message));
    } catch (emailErr) {
      console.error('📧 Could not prepare application email:', emailErr.message);
    }

    // ── Trigger AI resume processing ──
    if (req.file && jobId) {
      triggerResumeProcessing(candidate, req.file, jobId);
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      candidate: { id: candidate._id, name: candidate.name, email: candidate.email }
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ success: false, message: 'Error submitting application', error: error.message });
  }
};

/**
 * GET /api/candidates
 * List all candidates (with optional filters).
 */
export const getAllCandidates = async (req, res) => {
  try {
    const { status, jobId, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (jobId) filter.jobId = jobId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { positionApplied: { $regex: search, $options: 'i' } }
      ];
    }

    const candidates = await Candidate.find(filter).sort({ createdAt: -1 });
    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ success: false, message: 'Error fetching candidates', error: error.message });
  }
};

/**
 * GET /api/candidates/:id
 */
export const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('jobId'); // Populated to help with job info
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }
    res.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({ success: false, message: 'Error fetching candidate', error: error.message });
  }
};

/**
 * GET /api/candidates/:id/resume
 * Serve the resume file (inline display or download).
 */
export const getResume = async (req, res) => {
  try {
    const { promises: fs } = await import('fs');
    const { createReadStream } = await import('fs');

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    if (!candidate.resumePath) return res.status(404).json({ success: false, message: 'No resume on file for this candidate' });

    const absolutePath = path.resolve(BACKEND_DIR, candidate.resumePath);

    // Verify file exists
    try { await fs.access(absolutePath); } catch {
      return res.status(404).json({ success: false, message: 'Resume file not found on disk' });
    }

    const ext = path.extname(candidate.resumeFileName || candidate.resumePath).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    const disposition = req.query.download === 'true'
      ? `attachment; filename="${candidate.resumeFileName || 'resume' + ext}"`
      : `inline; filename="${candidate.resumeFileName || 'resume' + ext}"`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', disposition);
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.removeHeader('Content-Security-Policy');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    createReadStream(absolutePath).pipe(res);
  } catch (error) {
    console.error('Error serving resume:', error);
    res.status(500).json({ success: false, message: 'Error serving resume', error: error.message });
  }
};

/**
 * POST /api/candidates  (admin/recruiter manual creation)
 */
export const createCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.create(req.body);

    // ── Email trigger: Application Received (for manually-added candidates too) ──
    try {
      const job = candidate.jobId ? await Job.findById(candidate.jobId) : null;
      const jobInfo = job || { title: candidate.positionApplied || 'General Application' };
      sendApplicationReceivedEmail(candidate, jobInfo)
        .catch(err => console.error('📧 Application email failed (non-blocking):', err.message));
    } catch (emailErr) {
      console.error('📧 Could not prepare application email:', emailErr.message);
    }

    res.status(201).json(candidate);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A candidate with this email already exists for this job.' });
    }
    console.error('Error creating candidate:', error);
    res.status(500).json({ success: false, message: 'Error creating candidate', error: error.message });
  }
};

/**
 * PATCH /api/candidates/:id/status
 * Update a candidate's pipeline status — sends rejection email when status = 'Rejected'.
 */
export const updateCandidateStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const validStatuses = ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'Applied'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // ── AUTOMATION: Trigger Emails based on Status ──
    if (status === 'Rejected') {
      try {
        const job = candidate.jobId ? await Job.findById(candidate.jobId) : null;
        const jobInfo = job || { title: candidate.positionApplied || 'Position' };
        
        console.log(`📉 Sending rejection email to ${candidate.email}`);
        
        // Non-blocking email send
        sendRejectionEmail(candidate, jobInfo, rejectionReason)
          .catch(err => console.error('📧 Rejection email failed (non-blocking):', err.message));
      } catch (emailErr) {
        console.error('📧 Could not prepare rejection email:', emailErr.message);
      }
    }
    
    // Optional: Log other status changes
    if (status === 'Hired') {
        console.log(`🎉 Candidate ${candidate.email} was HIRED!`);
    }

    res.json({ success: true, candidate });
  } catch (error) {
    console.error('Error updating candidate status:', error);
    res.status(500).json({ success: false, message: 'Error updating status', error: error.message });
  }
};

/**
 * PATCH /api/candidates/bulk-updates
 */
export const bulkUpdateCandidates = async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No candidate IDs provided' });
    }

    const result = await Candidate.updateMany(
      { _id: { $in: ids } },
      { $set: updates }
    );

    // ── Email trigger: Bulk rejection ──
    if (updates.status === 'Rejected') {
      try {
        const rejectedCandidates = await Candidate.find({ _id: { $in: ids } });
        for (const candidate of rejectedCandidates) {
          const job = candidate.jobId ? await Job.findById(candidate.jobId) : null;
          const jobInfo = job || { title: candidate.positionApplied || 'Position' };
          
          sendRejectionEmail(candidate, jobInfo, updates.rejectionReason)
            .catch(err => console.error(`📧 Bulk rejection email failed for ${candidate.email}:`, err.message));
        }
      } catch (emailErr) {
        console.error('📧 Bulk rejection emails failed:', emailErr.message);
      }
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} candidates updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating candidates:', error);
    res.status(500).json({ success: false, message: 'Error updating candidates', error: error.message });
  }
};

/**
 * DELETE /api/candidates/bulk
 */
export const bulkDeleteCandidates = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No candidate IDs provided' });
    }
    await Candidate.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} candidates deleted successfully` });
  } catch (error) {
    console.error('Error deleting candidates:', error);
    res.status(500).json({ success: false, message: 'Error deleting candidates', error: error.message });
  }
};

/**
 * DELETE /api/candidates/:id
 */
export const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }
    res.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ success: false, message: 'Error deleting candidate', error: error.message });
  }
};