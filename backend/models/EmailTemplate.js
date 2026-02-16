// backend/models/EmailTemplate.js
import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
    // e.g., "application_received"
  },
  subject: { 
    type: String, 
    required: true 
    // e.g., "Thanks for applying, {{candidate_name}}!"
  },
  bodyHtml: { 
    type: String, 
    required: true 
    // e.g., "<h1>Hello {{candidate_name}}</h1>..."
  },
  bodyText: { 
    type: String 
    // Fallback plain text version (optional but good for spam filters)
  },
  variables: [{ 
    type: String 
    // e.g., ["candidate_name", "job_title", "company_name"]
  }],
  category: {
    type: String,
    enum: ['candidate', 'interviewer', 'admin', 'system'],
    default: 'candidate'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

export default mongoose.model('EmailTemplate', emailTemplateSchema);