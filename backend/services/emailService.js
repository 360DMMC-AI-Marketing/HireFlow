// backend/services/emailService.js
import { emailQueue } from '../queues/emailQueue.js';
import EmailLog from '../models/EmailLog.js';
import EmailTemplate from '../models/EmailTemplate.js';
import { generateIcs } from '../utils/calendarUtils.js'; // Ensure this file exists

/**
 * 1. Send Immediately
 * Wraps the scheduling function with a delay of 0
 */
export const sendTemplatedEmail = async (templateName, recipientEmail, variables, options = {}) => {
  return scheduleEmail(templateName, recipientEmail, variables, new Date(), options);
};

/**
 * 2. Schedule Email
 * Adds a job to the queue with a 'delay' so it sends later.
 * NOW UPDATED: Accepts 'options' (for attachments, cc, bcc, etc.)
 */
export const scheduleEmail = async (templateName, recipientEmail, variables, sendAt, options = {}) => {
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
    // We pass 'options' into the job data so the Worker can access attachments
    const job = await emailQueue.add('send-email', {
      logId: logEntry._id,
      templateName,
      recipientEmail,
      data: variables,
      options: options // <--- NEW: Pass attachments/options to the worker
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
 */
export const getEmailStatus = async (emailId) => {
  const emailLog = await EmailLog.findById(emailId);
  if (!emailLog) throw new Error('Email log not found');
  
  return {
    id: emailLog._id,
    to: emailLog.to,
    status: emailLog.status,
    sentAt: emailLog.sentAt,
    error: emailLog.error
  };
};

// --- TRIGGERS ---

export const sendApplicationReceivedEmail = async (candidate, job) => {
  return sendTemplatedEmail('application_received', candidate.email, {
    candidate_name: candidate.name,
    job_title: job.title,
    company_name: 'HireFlow'
  });
};

export const sendRejectionEmail = async (candidate, job, reason) => {
  return sendTemplatedEmail('application_rejected', candidate.email, {
    candidate_name: candidate.name,
    job_title: job.title,
    rejection_reason: reason || 'Not a good fit at this time'
  });
};

/**
 * Trigger 3: Interview Invitation (UPDATED)
 * Now generates an ICS calendar file and attaches it.
 */
export const sendInterviewInvitationEmail = async (candidate, job, interview) => {
  // 1. Generate ICS File content
  // Calculate end time (default to 60 mins if not specified)
  const duration = interview.duration || 60;
  const startTime = new Date(interview.scheduledAt || interview.date);
  const endTime = new Date(startTime.getTime() + duration * 60000);
  
  const icsContent = generateIcs({
    start: startTime,
    end: endTime,
    summary: `Interview: ${job.title} at HireFlow`,
    description: `Interview for ${job.title}. Join link: ${interview.meetingLink || interview.link}`,
    location: interview.location || 'Remote',
    url: interview.meetingLink || interview.link
  });

  // 2. Send the Invite Immediately WITH Attachment
  await sendTemplatedEmail('interview_invitation', candidate.email, {
    candidate_name: candidate.name,
    job_title: job.title,
    interview_date: startTime.toLocaleString(),
    interview_link: interview.meetingLink || interview.link
  }, {
    // Attach the ICS file
    attachments: [
      {
        filename: 'invite.ics',
        content: icsContent,
        contentType: 'text/calendar'
      }
    ]
  });

  // 3. Schedule Reminder (24 Hours Before) - No attachment needed for reminder
  const reminderDate = new Date(startTime.getTime() - 24 * 60 * 60 * 1000); // Minus 24h

  if (reminderDate > new Date()) {
    await scheduleEmail('interview_reminder', candidate.email, {
      candidate_name: candidate.name,
      interview_date: startTime.toLocaleString()
    }, reminderDate);
    console.log(`Interview reminder scheduled for ${reminderDate}`);
  }
};

// Alias
export const sendEmail = sendTemplatedEmail;