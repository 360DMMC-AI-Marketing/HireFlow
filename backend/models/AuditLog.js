import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  // Who did it
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  userEmail: String,
  userRole: String,

  // What they did
  action: {
    type: String,
    required: true,
    enum: [
      // Auth
      'login', 'logout', 'signup', 'password_reset',
      // Jobs
      'job_created', 'job_updated', 'job_deleted', 'job_status_changed',
      // Candidates
      'candidate_created', 'candidate_updated', 'candidate_deleted', 'candidate_status_changed',
      // Interviews
      'interview_created', 'interview_started', 'interview_completed', 'interview_deleted',
      // AI Interviews
      'ai_interview_created', 'ai_interview_started', 'ai_interview_completed', 'ai_interview_deleted',
      // Team
      'member_invited', 'member_removed', 'member_role_changed',
      // Company
      'company_updated', 'company_created',
      // Settings
      'settings_updated', 'integration_connected', 'integration_disconnected',
      // Billing
      'plan_upgraded', 'plan_downgraded', 'plan_cancelled', 'plan_resumed',
      // Emails
      'email_sent', 'email_template_created', 'email_template_updated',
      // Other
      'export_data', 'other'
    ]
  },

  // What it affected
  resource: {
    type: String,
    enum: ['job', 'candidate', 'interview', 'ai_interview', 'user', 'company', 'email', 'template', 'billing', 'settings', 'other']
  },
  resourceId: mongoose.Schema.Types.ObjectId,
  resourceName: String,

  // Details
  description: String,
  metadata: mongoose.Schema.Types.Mixed, // Any extra data (old values, new values, etc.)

  // Context
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Indexes for fast querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });

// Auto-expire old logs after 90 days (optional — remove if you want permanent logs)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model('AuditLog', auditLogSchema);