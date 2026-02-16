import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import EmailTemplate from '../models/EmailTemplate.js';
import EmailLog from '../models/EmailLog.js';
import { compileEmail } from '../utils/email-templates.js';

// Redis Connection for Worker
const connection = new IORedis({ host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null });

// Configure Transporter (Moved from Service to Worker)
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
  const { logId, templateName, recipientEmail, data } = job.data;
  
  try {
    console.log(`Processing email job ${job.id} for ${recipientEmail}`);

    // 1. Fetch Template
    const templateDoc = await EmailTemplate.findOne({ name: templateName });
    if (!templateDoc || !templateDoc.isActive) {
      throw new Error(`Template '${templateName}' not found or inactive`);
    }

    // 2. Compile content
    const { subject, html, text } = compileEmail(templateDoc, data);

    // 3. Send via Nodemailer
    await transporter.sendMail({
      from: '"HireFlow Team" <no-reply@hireflow.com>',
      to: recipientEmail,
      subject,
      html,
      text
    });

    // 4. Update Log -> SENT
    await EmailLog.findByIdAndUpdate(logId, {
      status: 'sent',
      sentAt: new Date()
    });
    
    console.log(`Email sent successfully: ${job.id}`);

  } catch (error) {
    console.error(`Job ${job.id} failed:`, error.message);
    
    // 5. Update Log -> FAILED (BullMQ will retry if attempts < 3)
    await EmailLog.findByIdAndUpdate(logId, {
      status: 'failed',
      error: error.message
    });
    
    throw error; // Throwing triggers the retry logic
  }
};

// Initialize Worker
export const emailWorker = new Worker('email-queue', processEmailJob, { connection });

// Handle Worker Events
emailWorker.on('completed', job => console.log(`Job ${job.id} completed.`));
emailWorker.on('failed', (job, err) => console.log(`Job ${job.id} failed: ${err.message}`));