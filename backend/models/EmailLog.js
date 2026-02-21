import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
  to: { type: String, required: true },
  templateName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['queued', 'scheduled', 'sent', 'failed', 'retrying'],
    default: 'queued'
  },
  metadata: { type: Object },
  error: { type: String },
  jobId: { type: String },
  sentAt: { type: Date },
  scheduledAt: { type: Date },
  deliveredAt: { type: Date },
  openedAt: { type: Date },
  bouncedAt: { type: Date },
  clickedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('EmailLog', emailLogSchema);