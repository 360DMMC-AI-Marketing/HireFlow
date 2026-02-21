import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EmailTemplate from '../models/EmailTemplate.js';
import EmailLog from '../models/EmailLog.js';
import { compileEmail } from '../utils/email-templates.js';

// Load environment variables (crucial for standalone workers)
dotenv.config();

// ─── 1. Connect to MongoDB ───────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL)
  .then(() => console.log('✅ [EmailWorker] Connected to MongoDB'))
  .catch(err => console.error('❌ [EmailWorker] MongoDB connection error:', err));

// ─── 2. Connect to Redis ─────────────────────────────────────────────────────
const connection = new IORedis({ 
  host: process.env.REDIS_HOST || '127.0.0.1', 
  port: parseInt(process.env.REDIS_PORT) || 6379, 
  maxRetriesPerRequest: null 
});

// Configure Transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// The Processor Function
const processEmailJob = async (job) => {
  const { logId, templateName, recipientEmail, data, options = {} } = job.data;
  
  try {
    console.log(`⏳ Processing email job ${job.id} for ${recipientEmail}`);

    // 1. Fetch Template
    const templateDoc = await EmailTemplate.findOne({ name: templateName });
    if (!templateDoc || !templateDoc.isActive) {
      throw new Error(`Template '${templateName}' not found or inactive`);
    }

    // 2. Compile content
    const { subject, html, text } = compileEmail(templateDoc, data);

    // 3. Send via Nodemailer
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"HireFlow Team" <no-reply@hireflow.com>',
      to: recipientEmail,
      subject,
      html,
      text,
      ...options
    });

    // 4. Update Log -> SENT
    if (logId) {
      await EmailLog.findByIdAndUpdate(logId, {
        status: 'sent',
        sentAt: new Date()
      });
    }
    
    console.log(`✅ Email sent successfully: ${job.id}`);

  } catch (error) {
    console.error(`❌ Job ${job.id} failed:`, error.message);
    
    // 5. Update Log -> FAILED 
    if (logId) {
      await EmailLog.findByIdAndUpdate(logId, {
        status: 'failed',
        error: error.message
      });
    }
    
    throw error; // Triggers BullMQ retry logic
  }
};

// Initialize Worker
export const emailWorker = new Worker('email-queue', processEmailJob, { connection });

// Handle Worker Events
emailWorker.on('completed', job => console.log(`🎉 Job ${job.id} completed.`));
emailWorker.on('failed', (job, err) => console.log(`⚠️ Job ${job.id} failed: ${err.message}`));