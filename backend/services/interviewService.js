import { DateTime } from 'luxon';
import crypto from 'crypto';
import InterviewSlot from '../models/InterviewSlot.js';
import Interview from '../models/interview.js';
import Candidate from '../models/candidate.js';
import Job from '../models/job.js';
import * as emailService from './emailService.js';

// Google Calendar is optional — don't crash if not configured
let googleCalendarService = null;
try {
  googleCalendarService = await import('./googleCalendarService.js');
} catch (err) {
  console.warn('⚠️  Google Calendar service not available:', err.message);
}

// ─── Magic Link Token Store (in-memory for now, move to Redis/DB later) ──────
// Map<token, { candidateId, jobId, expiresAt }>
const magicTokens = new Map();

// ─── 1. Get Available Slots ──────────────────────────────────────────────────
export const getAvailableSlots = async (jobId, timezone = 'UTC') => {
  const now = new Date();

  const slots = await InterviewSlot.find({
    startTime: { $gt: now },
    isAvailable: true,
    $or: [
      { jobId: jobId || null },
      { jobId: null }
    ]
  }).sort({ startTime: 1 });

  return slots.map(slot => ({
    id: slot._id,
    startTime: DateTime.fromJSDate(slot.startTime).setZone(timezone).toISO(),
    endTime: DateTime.fromJSDate(slot.endTime).setZone(timezone).toISO(),
    interviewerId: slot.interviewerId
  }));
};

// ─── 2. Book Interview ───────────────────────────────────────────────────────
export const bookInterview = async (candidateId, slotId, jobId) => {
  console.log(`Booking slot ${slotId} for candidate ${candidateId}`);

  // A. Validate Slot
  const slot = await InterviewSlot.findById(slotId);
  if (!slot) throw new Error('Slot not found');
  if (!slot.isAvailable) throw new Error('Slot is no longer available');

  // B. Validate Candidate & Job
  const candidate = await Candidate.findById(candidateId);
  const job = await Job.findById(jobId);
  if (!candidate) throw new Error('Invalid Candidate ID');
  if (!job) throw new Error('Invalid Job ID');

  // C. Google Calendar sync (optional)
  const endTime = slot.endTime || new Date(slot.startTime.getTime() + 60 * 60000);
  let meetingLink = 'https://meet.google.com/new';

  if (googleCalendarService) {
    try {
      const googleData = await googleCalendarService.createGoogleCalendarEvent(slot.interviewerId, {
        summary: `Interview for ${job.title}`,
        description: `Candidate: ${candidate.name}`,
        startTime: slot.startTime,
        endTime: endTime,
        candidateEmail: candidate.email,
        candidateName: candidate.name,
        jobTitle: job.title
      });
      if (googleData && googleData.meetLink) {
        meetingLink = googleData.meetLink;
      }
    } catch (err) {
      console.warn('Google Calendar sync skipped:', err.message);
    }
  }

  // D. Create Interview record
  const interview = await Interview.create({
    jobId,
    candidateId,
    scheduledBy: slot.interviewerId,
    scheduledAt: slot.startTime,
    duration: 60,
    location: 'Remote',
    meetingLink,
    status: 'Scheduled'
  });

  // E. Mark Slot as taken
  slot.currentBookings += 1;
  if (slot.currentBookings >= slot.maxBookings) {
    slot.isAvailable = false;
  }
  await slot.save();

  // F. Update Candidate Status
  candidate.status = 'Interview';
  await candidate.save();

  // G. Trigger email notification
  try {
    await emailService.sendInterviewInvitationEmail(candidate, job, {
      date: interview.scheduledAt,
      link: meetingLink
    });
  } catch (err) {
    console.error('Interview email failed (non-blocking):', err.message);
  }

  return interview;
};

// ─── 3. Cancel Interview ─────────────────────────────────────────────────────
export const cancelInterview = async (interviewId, reason) => {
  const interview = await Interview.findById(interviewId);
  if (!interview) throw new Error('Interview not found');
  if (interview.status === 'Cancelled') throw new Error('Interview is already cancelled');

  interview.status = 'Cancelled';
  interview.notes = reason || interview.notes;
  await interview.save();

  // Free up the slot
  const slot = await InterviewSlot.findOne({
    interviewerId: interview.scheduledBy,
    startTime: interview.scheduledAt
  });
  if (slot) {
    slot.currentBookings = Math.max(0, slot.currentBookings - 1);
    slot.isAvailable = true;
    await slot.save();
  }

  return interview;
};

// ─── 4. Reschedule Interview ─────────────────────────────────────────────────
export const rescheduleInterview = async (interviewId, newSlotId) => {
  const interview = await Interview.findById(interviewId);
  if (!interview) throw new Error('Interview not found');

  // Cancel old
  await cancelInterview(interviewId, 'Rescheduled');

  // Book new
  const newInterview = await bookInterview(
    interview.candidateId,
    newSlotId,
    interview.jobId
  );

  return newInterview;
};

// ─── 5. Magic Link Token Generation ─────────────────────────────────────────
export const generateMagicToken = (candidateId, jobId) => {
  const token = crypto.randomBytes(32).toString('hex');
  magicTokens.set(token, {
    candidateId,
    jobId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  return token;
};

export const validateMagicToken = async (token) => {
  const data = magicTokens.get(token);
  if (!data) throw new Error('Invalid or expired scheduling link');
  if (new Date() > data.expiresAt) {
    magicTokens.delete(token);
    throw new Error('Scheduling link has expired');
  }

  const candidate = await Candidate.findById(data.candidateId).select('name email positionApplied');
  const job = await Job.findById(data.jobId).select('title department');
  const slots = await getAvailableSlots(data.jobId);

  return { candidate, job, slots };
};

export const bookInterviewByToken = async (token, slotId) => {
  const data = magicTokens.get(token);
  if (!data) throw new Error('Invalid or expired scheduling link');
  if (new Date() > data.expiresAt) {
    magicTokens.delete(token);
    throw new Error('Scheduling link has expired');
  }

  const interview = await bookInterview(data.candidateId, slotId, data.jobId);
  magicTokens.delete(token); // One-time use
  return interview;
};