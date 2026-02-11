// Candidate model
import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  name: { 
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true, 
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
  },
  phone: {
    type: String
  },
  location: {
    type: String
  },
  linkedIn: {
    type: String
  },
  title: {
    type: String
  },
  summary: {
    type: String
  },
  positionApplied: {
    type: String
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  status: {
    type: String,
    enum: ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'Applied'],
    default: 'New'
  },
  source: {
    type: String,
    enum: ['LinkedIn', 'Indeed', 'Email', 'HireFlow Direct', 'Referral'],
    default: 'HireFlow Direct'
  },
  matchScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  resumePath: {
    type: String
  },
  resumeFileName: {
    type: String
  },
  resume_data: {
    type: String
  },
  scores: {
    type: Map,
    of: Number
  },
  experience: [{
    title: String,
    company: String,
    duration: String,
    description: String
  }],
  education: [{
    degree: String,
    institution: String,
    year: String
  }],
  avatar: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Candidate', candidateSchema);
