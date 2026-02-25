import mongoose from 'mongoose';

const questionBankSchema = new mongoose.Schema({
  // Ownership scope: null company = system default, null job = company-wide
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  text: { type: String, required: true },
  followUpPrompt: String,           // hint for AI to ask follow-ups
  type: {
    type: String,
    enum: ['behavioral', 'technical', 'situational', 'general'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: String,                  // "leadership", "problem-solving", etc.
  idealResponseHints: String,        // tells Claude what a good answer looks like
  maxDurationSeconds: {
    type: Number,
    default: 120
  },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  timesUsed: { type: Number, default: 0 },
  averageScore: Number
}, { timestamps: true });

questionBankSchema.index({ companyId: 1, type: 1, isActive: 1 });
questionBankSchema.index({ jobId: 1, isActive: 1 });

export default mongoose.model('QuestionBank', questionBankSchema);