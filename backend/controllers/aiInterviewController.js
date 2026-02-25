import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import AIInterviewSession from '../models/AIInterviewSession.js';
import QuestionBank from '../models/QuestionBank.js';

// ─── SESSION MANAGEMENT ──────────────────────────────────────────────────────

/**
 * POST /api/v1/ai-interviews
 * Create a new AI interview session. Auto-selects questions from bank.
 */
export const createSession = async (req, res) => {
  try {
    const { jobId, candidateId, applicationId, questionIds, numQuestions = 10 } = req.body;

    // Resolve questions: explicit IDs or auto-select
    let questions;
    if (questionIds?.length > 0) {
      questions = await QuestionBank.find({ _id: { $in: questionIds } });
    } else {
      // Priority: job-specific → company-wide → system defaults
      const jobQ = await QuestionBank.find({ jobId, isActive: true });
      const compQ = await QuestionBank.find({
        companyId: req.user.company, jobId: null, isActive: true
      });
      const defQ = await QuestionBank.find({ isDefault: true, isActive: true });

      const all = [...jobQ, ...compQ, ...defQ];
      const seen = new Set();
      questions = all.filter(q => {
        if (seen.has(q._id.toString())) return false;
        seen.add(q._id.toString());
        return true;
      }).slice(0, numQuestions);
    }

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions available. Add questions to the bank first.'
      });
    }

    const session = await AIInterviewSession.create({
      jobId,
      candidateId,
      applicationId,
      companyId: req.user.company,
      magicToken: uuidv4(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      questions: questions.map((q, i) => ({
        questionId: q._id,
        questionText: q.text,
        questionType: q.type,
        order: i
      }))
    });

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/ai-interviews/:id
 */
export const getSession = async (req, res) => {
  try {
    const session = await AIInterviewSession.findById(req.params.id)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title department');

    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/ai-interviews/job/:jobId
 */
export const getSessionsByJob = async (req, res) => {
  try {
    const sessions = await AIInterviewSession.find({ jobId: req.params.jobId })
      .populate('candidateId', 'name email')
      .select('-attentionData')       // exclude large array for list views
      .sort('-createdAt');
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/ai-interviews/candidate/:candidateId
 */
export const getSessionsByCandidate = async (req, res) => {
  try {
    const sessions = await AIInterviewSession.find({ candidateId: req.params.candidateId })
      .populate('jobId', 'title')
      .select('-attentionData')
      .sort('-createdAt');
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/v1/ai-interviews/:id
 */
export const deleteSession = async (req, res) => {
  try {
    const session = await AIInterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });

    // If in-progress, cancel it first (cleanup)
    if (session.status === 'in-progress') {
      session.status = 'cancelled';
      session.completedAt = new Date();
      await session.save();
    }

    await AIInterviewSession.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── MAGIC LINK ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/ai-interviews/:id/magic-link
 */
export const generateMagicLink = async (req, res) => {
  try {
    const session = await AIInterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });

    session.magicToken = uuidv4();
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await session.save();

    const link = `${process.env.CLIENT_URL}/ai-interview/join/${session.magicToken}`;
    res.json({ success: true, data: { link, expiresAt: session.expiresAt } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/ai-interviews/join/:magicToken   (PUBLIC — no auth)
 */
export const joinViaMagicToken = async (req, res) => {
  try {
    const session = await AIInterviewSession.findOne({
      magicToken: req.params.magicToken,
      expiresAt: { $gt: new Date() }
    }).populate('jobId', 'title').populate('candidateId', 'name email');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Invalid or expired link' });
    }

    // Generate a temporary JWT for the candidate (valid 2 hours)
    const tempToken = jwt.sign(
      {
        id: session.candidateId._id,
        role: 'candidate',
        sessionId: session._id,
        isInterviewToken: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        jobTitle: session.jobId?.title,
        candidateName: session.candidateId?.name,
        totalQuestions: session.questions.length,
        estimatedDuration: session.questions.length * 2,
        status: session.status,
        token: tempToken  // ← candidate uses this for socket auth
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ANALYSIS ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/ai-interviews/:id/analysis
 */
export const getAnalysis = async (req, res) => {
  try {
    const session = await AIInterviewSession.findById(req.params.id)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title');

    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    if (session.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Interview not yet completed' });
    }

    res.json({
      success: true,
      data: {
        overallAnalysis: session.overallAnalysis,
        questions: session.questions.map(q => ({
          questionText: q.questionText,
          type: q.type,
          transcript: q.transcript,
          analysis: q.analysis,
          averageGazeScore: q.averageGazeScore,
          attentionFlags: q.attentionFlags,
          responseDuration: q.responseDuration
        })),
        overallAttentionScore: session.overallAttentionScore,
        duration: session.duration
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/ai-interviews/:id/comparison
 */
export const getResumeComparison = async (req, res) => {
  try {
    const session = await AIInterviewSession.findById(req.params.id);
    if (!session?.overallAnalysis?.resumeComparison) {
      return res.status(404).json({ success: false, message: 'Comparison not available' });
    }
    res.json({ success: true, data: session.overallAnalysis.resumeComparison });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/ai-interviews/job/:jobId/rankings
 */
export const getCandidateRankings = async (req, res) => {
  try {
    const sessions = await AIInterviewSession.find({
      jobId: req.params.jobId,
      status: 'completed'
    })
      .populate('candidateId', 'name email')
      .select('candidateId overallAnalysis overallAttentionScore duration completedAt')
      .sort('-overallAnalysis.overallScore');

    const rankings = sessions.map((s, i) => ({
      rank: i + 1,
      candidate: s.candidateId,
      overallScore: s.overallAnalysis?.overallScore,
      recommendation: s.overallAnalysis?.recommendation,
      attentionScore: s.overallAttentionScore,
      duration: s.duration,
      completedAt: s.completedAt
    }));

    res.json({ success: true, data: rankings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── QUESTION BANK ───────────────────────────────────────────────────────────

export const getQuestionBank = async (req, res) => {
  try {
    const { type, jobId } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    if (jobId) filter.jobId = jobId;

    // Show: system defaults + company questions + job-specific
    filter.$or = [
      { isDefault: true },
      { companyId: req.user.company }
    ];

    const questions = await QuestionBank.find(filter).sort('type category');
    res.json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const question = await QuestionBank.create({
      ...req.body,
      companyId: req.user.company,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const question = await QuestionBank.findOneAndUpdate(
      { _id: req.params.questionId, companyId: req.user.company },
      req.body,
      { new: true }
    );
    if (!question) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    await QuestionBank.findOneAndUpdate(
      { _id: req.params.questionId, companyId: req.user.company },
      { isActive: false }
    );
    res.json({ success: true, message: 'Question deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};