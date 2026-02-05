import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a job title'],
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Design', 'Product', 'Operations', 'Customer Support']
  },
  employmentType: {
    type: String,
    required: true,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    default: 'Full-time'
  },
  location: {
    type: String,
    required: true
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Paused', 'Closed'],
    default: 'Draft'
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    displaySalary: {
      type: Boolean,
      default: true
    }
  },
  description: {
    type: String,
    required: true
  },
  responsibilities: [{
    type: String
  }],
  requirements: [{
    type: String
  }],
  benefits: [{
    type: String
  }],
  // Screening criteria
  screeningCriteria: {
    requiredSkills: [String],
    minYearsExperience: Number,
    educationLevel: String,
    dealBreakerKeywords: [String]
  },
  // Distribution settings
  distribution: {
    linkedin: {
      enabled: { type: Boolean, default: false },
      seniorityLevel: String,
      jobFunction: String,
      sponsored: { type: Boolean, default: false }
    },
    indeed: {
      enabled: { type: Boolean, default: false },
      salaryDisplay: {
        type: String,
        enum: ['Hide', 'Show range', 'Show starting'],
        default: 'Hide'
      },
      screeningQuestions: [String],
      sponsored: { type: Boolean, default: false }
    },
    hireflowPortal: {
      enabled: { type: Boolean, default: true },
      slug: String,
      customDomain: String
    },
    emailApplications: {
      enabled: { type: Boolean, default: false },
      email: String
    }
  },
  // Analytics
  analytics: {
    totalApplicants: { type: Number, default: 0 },
    screenedApplicants: { type: Number, default: 0 },
    interviewsScheduled: { type: Number, default: 0 },
    interviewsCompleted: { type: Number, default: 0 },
    topCandidates: { type: Number, default: 0 }
  },
  // User who created the job
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // AI assistance flag
  isAIGenerated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for search and filtering
jobSchema.index({ title: 'text', department: 1, status: 1 });

export default mongoose.models.Job || mongoose.model('Job', jobSchema);
