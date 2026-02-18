// backend/controllers/interviewController.js
import * as interviewService from '../services/interviewService.js';
import InterviewSlot from '../models/InterviewSlot.js';
import Interview from '../models/interview.js';

// ─── SLOT MANAGEMENT ─────────────────────────────────────────────────────────

// 1. Recruiters: Create availability slots
export const createSlots = async (req, res) => {
  try {
    const { startTime, endTime, jobId, timezone } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'startTime and endTime are required' });
    }

    const slot = await InterviewSlot.create({
      interviewerId: req.user._id,
      startTime,
      endTime,
      jobId: jobId || null,
      timezone: timezone || 'UTC'
    });

    res.status(201).json(slot);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You already have a slot at this time' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get available slots (public — candidates use this via magic link)
export const getSlots = async (req, res) => {
  try {
    const { jobId, timezone } = req.query;
    const slots = await interviewService.getAvailableSlots(jobId, timezone);
    res.json(slots);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get recruiter's own slots
export const getMySlots = async (req, res) => {
  try {
    const slots = await InterviewSlot.find({ interviewerId: req.user._id })
      .sort({ startTime: 1 });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Delete a slot
export const deleteSlot = async (req, res) => {
  try {
    const slot = await InterviewSlot.findOneAndDelete({
      _id: req.params.id,
      interviewerId: req.user._id
    });
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    res.json({ success: true, message: 'Slot deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── INTERVIEW BOOKING & MANAGEMENT ──────────────────────────────────────────

// 5. Book a slot (candidate)
export const bookSlot = async (req, res) => {
  try {
    const { candidateId, slotId, jobId } = req.body;
    const interview = await interviewService.bookInterview(candidateId, slotId, jobId);
    res.json({ success: true, interview });
  } catch (error) {
    console.error('Booking Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// 6. Get all interviews (admin/recruiter dashboard)
export const getAllInterviews = async (req, res) => {
  try {
    const { status, jobId, candidateId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (jobId) filter.jobId = jobId;
    if (candidateId) filter.candidateId = candidateId;

    const interviews = await Interview.find(filter)
      .populate('candidateId', 'name email phone positionApplied')
      .populate('jobId', 'title department')
      .populate('scheduledBy', 'firstName lastName email')
      .sort({ scheduledAt: 1 });

    res.json(interviews);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Get single interview
export const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidateId', 'name email phone positionApplied')
      .populate('jobId', 'title department')
      .populate('scheduledBy', 'firstName lastName email');

    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.json(interview);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Cancel interview
export const cancelInterview = async (req, res) => {
  try {
    const { reason } = req.body;
    const interview = await interviewService.cancelInterview(req.params.id, reason);
    res.json({ success: true, interview });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 9. Reschedule interview
export const rescheduleInterview = async (req, res) => {
  try {
    const { newSlotId } = req.body;
    const interview = await interviewService.rescheduleInterview(req.params.id, newSlotId);
    res.json({ success: true, interview });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 10. Add feedback/notes after interview
export const addFeedback = async (req, res) => {
  try {
    const { notes, feedback, rating, status } = req.body;
    const update = {};
    if (notes !== undefined) update.notes = notes;
    if (feedback !== undefined) update.feedback = feedback;
    if (rating !== undefined) update.rating = rating;
    if (status) update.status = status;

    const interview = await Interview.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.json({ success: true, interview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── MAGIC LINK GENERATION (Protected) ───────────────────────────────────────

// 11. Generate a magic link token for a candidate/job pair
export const generateMagicLink = async (req, res) => {
  try {
    const { candidateId, jobId } = req.body;
    if (!candidateId || !jobId) {
      return res.status(400).json({ success: false, message: 'candidateId and jobId are required' });
    }
    const token = interviewService.generateMagicToken(candidateId, jobId);
    res.json({ success: true, token, link: `/schedule/${token}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUBLIC: Magic Link Scheduling ───────────────────────────────────────────

// 12. Validate magic link token & return scheduling data
export const validateScheduleToken = async (req, res) => {
  try {
    const data = await interviewService.validateMagicToken(req.params.token);
    res.json(data);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 12. Book via magic link (public)
export const bookViaToken = async (req, res) => {
  try {
    const { slotId } = req.body;
    const interview = await interviewService.bookInterviewByToken(req.params.token, slotId);
    res.json({ success: true, interview });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};