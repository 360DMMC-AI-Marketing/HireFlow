// backend/models/Candidate.js
import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  // --- Personal Info ---
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
  },
  phone: { type: String },
  location: { type: String },
  avatar: { type: String },
  
  // --- Professional Links ---
  linkedIn: { type: String },
  website: { type: String }, // NEW: AI often finds portfolio links

  // --- Job Relation ---
  positionApplied: { type: String },
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job',
    required: false // Optional: Allow manual candidate addition without specific job
  },
  
  // --- Application Status ---
  status: {
    type: String,
    enum: ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'Applied'],
    default: 'New'
  },
  source: {
    type: String,
    enum: ['LinkedIn', 'Indeed', 'Email', 'HireFlow Direct', 'Referral', 'Agency'],
    default: 'HireFlow Direct'
  },

  // --- AI ENGINE FIELDS (Crucial for your Feature) ---
  
  // 1. Searchable Skills: Allows you to filter "Show me candidates with React"
  skills: [{ type: String }], 
  
  // 2. The AI Analysis: Stores the warnings Gemini finds
  redFlags: [{ type: String }], 
  
  // 3. The Match: 0-100 score calculated by Gemini
  matchScore: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 100 
  },
  
  // 4. Processing Status: Tells Frontend if AI is still thinking
  processingStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Failed'],
    default: 'Pending'
  },

  // --- Resume Files ---
  resumePath: { type: String }, // The S3 URL
  resumeFileName: { type: String }, // "John_Doe_Resume.pdf"
  resumeText: { type: String }, // NEW: Store the raw extracted text here for searching later
  
  // --- Structured Data ---
  summary: { type: String }, // AI generated summary
  experience: [{
    title: String,
    company: String,
    startDate: String, // Changed from duration to start/end for better sorting
    endDate: String,
    description: String
  }],
  education: [{
    degree: String,
    institution: String,
    year: String
  }],

  // --- Meta ---
  appliedDate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound Index: Prevent same person applying to same job twice (only if jobId exists)
candidateSchema.index({ email: 1, jobId: 1 }, { unique: true, sparse: true });

export default mongoose.model('Candidate', candidateSchema);