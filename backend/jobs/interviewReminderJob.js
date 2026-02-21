// backend/jobs/interviewReminderJob.js
// ─────────────────────────────────────────────────────────────
// Background cron job that runs every hour.
// It scans for interviews happening in the NEXT 24–25 hours
// that haven't had a reminder sent yet, and queues a reminder
// email for each one via the email service.
// ─────────────────────────────────────────────────────────────

import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import Interview from '../models/interview.js';
import { sendInterviewReminderEmail } from '../services/emailService.js';

const connection = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null,
});

// ─── Queue ───────────────────────────────────────────────────
const reminderQueue = new Queue('interview-reminders', { connection });

// Add a repeatable job that fires every hour
const setupRepeatable = async () => {
  try {
    // Remove any old repeatable to avoid duplicates on restart
    const existing = await reminderQueue.getRepeatableJobs();
    for (const job of existing) {
      await reminderQueue.removeRepeatableByKey(job.key);
    }

    await reminderQueue.add(
      'check-reminders',
      {},
      { repeat: { pattern: '0 * * * *' } } // top of every hour
    );
    console.log('⏰ Interview reminder cron job scheduled (every hour)');
  } catch (err) {
    console.error('Failed to setup reminder cron:', err.message);
  }
};

// ─── Worker ──────────────────────────────────────────────────
const reminderWorker = new Worker(
  'interview-reminders',
  async () => {
    const now = new Date();
    // Window: interviews between 23h and 25h from now
    // This gives a 2-hour overlap window so we never miss one
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const upcomingInterviews = await Interview.find({
      scheduledAt: { $gte: windowStart, $lte: windowEnd },
      status: 'Scheduled',
      reminderSent: { $ne: true }
    }).populate('candidateId').populate('jobId');

    if (upcomingInterviews.length === 0) {
      console.log('⏰ Reminder check: No interviews needing reminders right now.');
      return;
    }

    console.log(`⏰ Sending reminders for ${upcomingInterviews.length} interview(s)...`);

    for (const interview of upcomingInterviews) {
      try {
        if (!interview.candidateId?.email) {
          console.warn(`Skipping reminder for interview ${interview._id}: no candidate email`);
          continue;
        }

        await sendInterviewReminderEmail(interview.candidateId, interview);

        // Mark reminder as sent so we don't resend
        interview.reminderSent = true;
        await interview.save();

        console.log(`  ✅ Reminder sent to ${interview.candidateId.email}`);
      } catch (err) {
        console.error(`  ❌ Failed reminder for interview ${interview._id}:`, err.message);
      }
    }
  },
  { connection }
);

reminderWorker.on('completed', () => console.log('⏰ Reminder check completed.'));
reminderWorker.on('failed', (job, err) => console.error('⏰ Reminder check failed:', err.message));

// Initialize
setupRepeatable();

export { reminderQueue, reminderWorker };
