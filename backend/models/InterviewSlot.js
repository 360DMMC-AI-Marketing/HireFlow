import mongoose from 'mongoose';

const interviewSlotSchema = new mongoose.Schema({
  interviewerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job' 
    // Optional: If null, this slot is open for ANY job. If set, only for that job.
  },
  

  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date, 
    required: true 
  },
  timezone: { 
    type: String, 
    default: 'UTC' // Store IANA timezone like "Africa/Tunis" or "Europe/Paris"
  },

  // Status
  isAvailable: { 
    type: Boolean, 
    default: true 
  },
  maxBookings: { 
    type: Number, 
    default: 1 // usually 1, but could be >1 for group interviews
  },
  currentBookings: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

// Ensure an interviewer cannot have overlapping slots
interviewSlotSchema.index({ interviewerId: 1, startTime: 1 }, { unique: true });

const InterviewSlot = mongoose.model('InterviewSlot', interviewSlotSchema);
export default InterviewSlot;