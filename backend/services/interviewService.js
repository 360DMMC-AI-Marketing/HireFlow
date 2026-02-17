import { DateTime } from 'luxon';
import InterviewSlot from '../models/InterviewSlot.js';
import Interview from '../models/interview.js'; 
import Candidate from '../models/candidate.js';
import Job from '../models/job.js';
import * as emailService from './emailService.js';
import * as googleCalendarService from './googleCalendarService.js'; // <--- NEW IMPORT

// 1. Get Available Slots
export const getAvailableSlots = async (jobId, timezone = 'UTC') => {
  const now = new Date();
  
  // Find slots in the future that are available
  const slots = await InterviewSlot.find({
    startTime: { $gt: now },
    isAvailable: true,
    $or: [
        { jobId: jobId }, // Specific to this job
        { jobId: null }   // OR open for any job
    ]
  }).sort({ startTime: 1 });

  // Convert to requested timezone
  return slots.map(slot => ({
    id: slot._id,
    startTime: DateTime.fromJSDate(slot.startTime).setZone(timezone).toString(),
    endTime: DateTime.fromJSDate(slot.endTime).setZone(timezone).toString(),
    interviewerId: slot.interviewerId
  }));
};

// 2. Book Interview
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

  // --- C. GOOGLE CALENDAR SYNC (NEW) ---
  const endTime = new Date(slot.startTime.getTime() + 60 * 60000); // 60 mins default
  
  // Default fallback link
  let meetingLink = `https://meet.google.com/new`; 

  // Try to sync with Google Calendar
  const googleData = await googleCalendarService.createGoogleCalendarEvent(slot.interviewerId, {
    summary: `Interview for ${job.title}`,
    description: `Candidate: ${candidate.name}`,
    startTime: slot.startTime,
    endTime: endTime,
    candidateEmail: candidate.email,
    candidateName: candidate.name,
    jobTitle: job.title
  });

  // If sync worked, override with real Google Meet link
  if (googleData && googleData.meetLink) {
    meetingLink = googleData.meetLink;
  }
  // -------------------------------------

  // D. Create Interview
  const interview = await Interview.create({
    jobId,
    candidateId,
    scheduledBy: slot.interviewerId,
    scheduledAt: slot.startTime,
    duration: 60,
    location: 'Remote',
    meetingLink: meetingLink, // Now uses the Google Meet link
    status: 'Scheduled'
  });

  // E. Mark Slot as Taken
  slot.currentBookings += 1;
  if (slot.currentBookings >= slot.maxBookings) {
    slot.isAvailable = false;
  }
  await slot.save();

  // F. Update Candidate Status
  candidate.status = 'Interview';
  await candidate.save();

  // G. Trigger Email (With ICS attachment)
  await emailService.sendInterviewInvitationEmail(candidate, job, interview);

  return interview;
};