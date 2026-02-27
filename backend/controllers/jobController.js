import Job from '../models/job.js';
import Candidate from '../models/candidate.js';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// @desc    Get all jobs with filters
// @route   GET /api/jobs
export const getAllJobs = async (req, res) => {
  try {
    const { status, department, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let query = {};
    
    if (status && status !== 'All') query.status = status;
    if (department && department !== 'All') query.department = department;
    if (search) query.title = { $regex: search, $options: 'i' };
    
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const jobs = await Job.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort(sortConfig);
    
    const jobIds = jobs.map(j => j._id);
    const counts = await Candidate.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id.toString()] = c.count; });
    
    const enrichedJobs = jobs.map(job => {
      const jobObj = job.toObject();
      jobObj.analytics = {
        ...jobObj.analytics,
        totalApplicants: countMap[job._id.toString()] || 0
      };
      return jobObj;
    });
      
    res.status(200).json(enrichedJobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get job by ID with analytics
// @route   GET /api/jobs/:id
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');
      
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const applicantCount = await Candidate.countDocuments({ jobId: job._id });
    const jobObj = job.toObject();
    jobObj.analytics = {
      ...jobObj.analytics,
      totalApplicants: applicantCount
    };
    
    res.status(200).json(jobObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a job (draft or publish)
// @route   POST /api/jobs
export const createJob = async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      createdBy: req.user?._id
    };
    
    if (jobData.distribution?.hireflowPortal?.enabled && !jobData.distribution.hireflowPortal.slug) {
      jobData.distribution.hireflowPortal.slug = jobData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    const newJob = await Job.create(jobData);
    res.status(201).json(newJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update job
// @route   PATCH /api/jobs/:id
export const updateJob = async (req, res) => {
  try {
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.status(200).json(updatedJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update job status
// @route   PATCH /api/jobs/:id/status
export const updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Draft', 'Active', 'Paused', 'Closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
export const deleteJob = async (req, res) => {
  try {
    const deletedJob = await Job.findByIdAndDelete(req.params.id);
    
    if (!deletedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Duplicate job
// @route   POST /api/jobs/:id/duplicate
export const duplicateJob = async (req, res) => {
  try {
    const originalJob = await Job.findById(req.params.id);
    
    if (!originalJob) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const jobData = originalJob.toObject();
    delete jobData._id;
    delete jobData.createdAt;
    delete jobData.updatedAt;
    jobData.title = `${jobData.title} (Copy)`;
    jobData.status = 'Draft';
    jobData.analytics = {
      totalApplicants: 0,
      screenedApplicants: 0,
      interviewsScheduled: 0,
      interviewsCompleted: 0,
      topCandidates: 0
    };
    
    const duplicatedJob = await Job.create(jobData);
    res.status(201).json(duplicatedJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Validate slug availability
// @route   POST /api/jobs/validate-slug
export const validateSlug = async (req, res) => {
  try {
    const { slug, excludeId } = req.body;
    
    const query = { 'distribution.hireflowPortal.slug': slug };
    if (excludeId) query._id = { $ne: excludeId };
    
    const existingJob = await Job.findOne(query);
    
    res.status(200).json({ available: !existingJob });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get job analytics
// @route   GET /api/jobs/:id/analytics
export const getJobAnalytics = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.status(200).json({
      analytics: job.analytics,
      status: job.status,
      createdAt: job.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save job as draft
// @route   POST /api/jobs/draft
export const saveDraft = async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      status: 'Draft',
      createdBy: req.user?._id
    };
    
    const draft = await Job.create(jobData);
    res.status(201).json(draft);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Generate job description using AI
// @route   POST /api/jobs/generate-description
export const generateDescription = async (req, res) => {
  try {
    const { title, skills, keywords } = req.body;

    if (!title) return res.status(400).json({ message: 'Job title is required' });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR Recruiter. Always respond with ONLY valid JSON. No explanation, no markdown fences.'
        },
        {
          role: 'user',
          content: `Write a professional Job Description for a "${title}".

Requirements to include: ${skills?.join(', ') || 'Standard industry skills'}
Keywords/Vibe: ${keywords || 'Professional'}

Return JSON with this exact structure:
{
  "description": "2 paragraph engaging company intro and role overview.",
  "responsibilities": "Bullet points of daily tasks (HTML format <ul><li>...</li></ul>)",
  "requirements": "Bullet points of required skills (HTML format <ul><li>...</li></ul>)",
  "benefits": "Standard benefits list (HTML format <ul><li>...</li></ul>)"
}`
        }
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const text = response.choices[0]?.message?.content?.trim();
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const jsonResponse = JSON.parse(cleaned);
    res.status(200).json(jsonResponse);

  } catch (error) {
    console.error("AI Generation Failed:", error);
    res.status(200).json({
      description: `We are looking for a talented ${req.body.title} to join our team.`,
      responsibilities: "<ul><li>TBD</li></ul>",
      requirements: "<ul><li>TBD</li></ul>",
      benefits: "<ul><li>Competitive Salary</li></ul>"
    });
  }
};