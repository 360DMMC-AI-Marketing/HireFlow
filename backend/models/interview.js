import mongoose from 'mongoose';

const InterviewSchema = new mongoose.Schema({
  // Links to other core models
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', 
    required: true 
  },
  candidateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Candidate', 
    required: true 
  },
  scheduledBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // The recruiter/interviewer
    required: true 
  },

  // Interview Details
  interviewType: { 
    type: String, 
    enum: ['Phone', 'Video', 'Onsite'], 
    default: 'Video' 
  },
  status: { 
    type: String, 
    enum: ['Scheduled', 'Completed', 'Cancelled', 'NoShow'], 
    default: 'Scheduled' 
  },
  scheduledAt: { 
    type: Date, 
    required: true 
  },
  duration: { 
    type: Number, // In minutes (e.g., 30, 60)
    default: 60 
  },
  
  // connection info
  location: { 
    type: String, 
    default: 'Remote' // Physical address or "Remote"
  },
  meetingLink: { 
    type: String 
  },

  // Post-Interview Data
  notes: { type: String },
  feedback: { type: String }, // Private feedback for the hiring team
  rating: { 
    type: Number, 
    min: 1, 
    max: 5 
  },
  
  // Reminder tracking
  reminderSent: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Index for quick lookups of a candidate's interviews
InterviewSchema.index({ candidateId: 1, scheduledAt: 1 });

const Interview = mongoose.model('Interview', InterviewSchema);
export default Interview;