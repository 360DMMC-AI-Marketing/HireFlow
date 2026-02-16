// backend/services/emailService.js
import { emailQueue } from '../queues/emailQueue.js';
import EmailLog from '../models/EmailLog.js';
import EmailTemplate from '../models/EmailTemplate.js';

/**
 * 1. Send Immediately
 * Wraps the scheduling function with a delay of 0
 */
export const sendTemplatedEmail = async (templateName, recipientEmail, variables, options = {}) => {
  return scheduleEmail(templateName, recipientEmail, variables, new Date());
};

/**
 * 2. Schedule Email
 * Adds a job to the queue with a 'delay' so it sends later.
 */
export const scheduleEmail = async (templateName, recipientEmail, variables, sendAt) => {
  try {
    // Calculate delay in milliseconds
    const now = new Date();
    const sendDate = new Date(sendAt);
    const delay = Math.max(0, sendDate.getTime() - now.getTime());

    // Create Log Entry (Status: Scheduled)
    const logEntry = await EmailLog.create({
      to: recipientEmail,
      templateName: templateName,
      status: delay > 0 ? 'scheduled' : 'queued',
      metadata: variables,
      scheduledAt: sendDate
    });

    // Add to BullMQ with delay
    const job = await emailQueue.add('send-email', {
      logId: logEntry._id,
      templateName,
      recipientEmail,
      data: variables
    }, { 
      delay: delay,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });

    // Save Job ID to link them
    logEntry.jobId = job.id;
    await logEntry.save();

    console.log(`Email scheduled for ${sendDate.toISOString()} (Job ID: ${job.id})`);
    return { success: true, message: 'Email scheduled', emailId: logEntry._id };

  } catch (error) {
    console.error('Error scheduling email:', error);
    throw error;
  }
};

/**
 * 3. Get Email Status
 * Checks the database for the current state of an email.
 */
export const getEmailStatus = async (emailId) => {
  const emailLog = await EmailLog.findById(emailId);
  if (!emailLog) throw new Error('Email log not found');
  
  return {
    id: emailLog._id,
    to: emailLog.to,
    status: emailLog.status, // queued, sent, failed, scheduled
    sentAt: emailLog.sentAt,
    error: emailLog.error
  };
};
export const sendApplicationReceivedEmail = async (candidate, job) => {
  return sendTemplatedEmail('application_received', candidate.email, {
    candidate_name: candidate.name,
    job_title: job.title,
    company_name: 'HireFlow'
  });
};

/**
 * Trigger 2: Rejection Email
 */
export const sendRejectionEmail = async (candidate, job, reason) => {
  return sendTemplatedEmail('application_rejected', candidate.email, {
    candidate_name: candidate.name,
    job_title: job.title,
    rejection_reason: reason || 'Not a good fit at this time'
  });
};

/**
 * Trigger 3: Interview Invitation
 */
export const sendInterviewInvitationEmail = async (candidate, job, interview) => {
  // 1. Send the Invite Immediately
  await sendTemplatedEmail('interview_invitation', candidate.email, {
    candidate_name: candidate.name,
    job_title: job.title,
    interview_date: new Date(interview.date).toLocaleString(),
    interview_link: interview.link
  });

  // 2. Schedule Reminder (24 Hours Before)
  const interviewDate = new Date(interview.date);
  const reminderDate = new Date(interviewDate.getTime() - 24 * 60 * 60 * 1000); // Minus 24h

  // Only schedule if the reminder time is in the future
  if (reminderDate > new Date()) {
    await scheduleEmail('interview_reminder', candidate.email, {
      candidate_name: candidate.name,
      interview_date: interviewDate.toLocaleString()
    }, reminderDate);
    console.log(`Interview reminder scheduled for ${reminderDate}`);
  }
};

// Alias for backward compatibility (so your other code doesn't break)
export const sendEmail = sendTemplatedEmail;