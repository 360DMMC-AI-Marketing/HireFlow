import mongoose from 'mongoose';

// ── Subdocument: one attention reading per second ──
const attentionDataPointSchema = new mongoose.Schema({
  timestamp: Number,        // seconds from interview start
  gazeScore: Number,        // 0-100: how centered is gaze on camera
  headPose: {
    pitch: Number,          // looking up/down
    yaw: Number,            // looking left/right
    roll: Number            // head tilt
  },
  faceDetected: Boolean,
  multipleFaces: Boolean    // red flag: someone else appeared in frame
}, { _id: false });

// ── Subdocument: one question + candidate's response + AI score ──
const questionResponseSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank' },
  questionText: String,
  questionType: {
    type: String,
    enum: ['behavioral', 'technical', 'situational', 'general']
  },
  order: Number,

  // What the candidate said (filled in real-time by Deepgram)
  transcript: String,
  responseStartTime: Number,   // seconds from interview start
  responseEndTime: Number,
  responseDuration: Number,    // seconds

  // AI evaluation (filled after interview by Claude)
  analysis: {
    score: { type: Number, min: 0, max: 100 },
    communicationScore: { type: Number, min: 0, max: 100 },
    relevanceScore: { type: Number, min: 0, max: 100 },
    depthScore: { type: Number, min: 0, max: 100 },
    strengths: [String],
    concerns: [String],
    summary: String
  },

  // Gaze data during this specific question
  averageGazeScore: Number,
  attentionFlags: [String]   // e.g. "looked away for 8s at 3:42"
}, { _id: true });

// ── Main document: one per AI interview ──
const aiInterviewSessionSchema = new mongoose.Schema({
  // ── References (match your existing model names) ──
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',              // your existing Job model
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',        // your existing Candidate model
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'       // your existing Application model
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'           // your existing Company model
  },

  // ── Session lifecycle ──
  status: {
    type: String,
    enum: [
      'scheduled',    // created, waiting for candidate
      'tech-check',   // candidate is on the tech check page
      'in-progress',  // interview is live
      'completed',    // finished normally
      'failed',       // technical failure
      'cancelled'     // manually cancelled
    ],
    default: 'scheduled'
  },

  // State machine position (only relevant during 'in-progress')
  currentState: {
    type: String,
    enum: ['idle', 'greeting', 'asking', 'listening', 'processing', 'closing', 'done'],
    default: 'idle'
  },
  currentQuestionIndex: { type: Number, default: 0 },

  // ── Access control ──
  magicToken: { type: String, unique: true },  // candidate joins via this
  expiresAt: Date,

  // ── Timing ──
  scheduledAt: Date,
  startedAt: Date,
  completedAt: Date,
  duration: Number,   // total interview length in seconds

  // ── Questions & Responses ──
  questions: [questionResponseSchema],

  // ── Attention monitoring (one data point per second) ──
  attentionData: [attentionDataPointSchema],
  overallAttentionScore: Number,

  // ── Recordings ──
  recordings: {
    video: { url: String, s3Key: String, duration: Number },
    audio: { url: String, s3Key: String, duration: Number }
  },

  // ── Overall AI analysis (filled after completion) ──
  overallAnalysis: {
    overallScore: { type: Number, min: 0, max: 100 },
    communicationScore: { type: Number, min: 0, max: 100 },
    technicalScore: { type: Number, min: 0, max: 100 },
    cultureFitScore: { type: Number, min: 0, max: 100 },
    strengths: [String],
    concerns: [String],
    recommendation: {
      type: String,
      enum: ['strong-yes', 'yes', 'maybe', 'no', 'strong-no']
    },
    summary: String,
    resumeComparison: {
      consistencies: [String],
      discrepancies: [String],
      additionalInsights: [String]
    }
  },

  // ── Tech metadata ──
  browserInfo: String,
  networkQuality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor']
  },
  techCheckPassed: { type: Boolean, default: false }

}, { timestamps: true });

// Indexes for common queries
aiInterviewSessionSchema.index({ magicToken: 1 });
aiInterviewSessionSchema.index({ jobId: 1, status: 1 });
aiInterviewSessionSchema.index({ candidateId: 1 });
aiInterviewSessionSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.model('AIInterviewSession', aiInterviewSessionSchema);