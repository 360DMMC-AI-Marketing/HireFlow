// backend/controllers/interviewController.js
import * as interviewService from '../services/interviewService.js'; // Import the service logic
import InterviewSlot from '../models/InterviewSlot.js'; // Import the model

// 1. Recruiters: Create Slots (Availability)
export const createSlots = async (req, res) => {
  try {
    const { startTime, endTime } = req.body; // Expects ISO strings
    
    // We assume req.user._id exists because of the 'protect' middleware
    const slot = await InterviewSlot.create({
      interviewerId: req.user._id, 
      startTime,
      endTime
    });
    
    res.status(201).json(slot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Candidates: Get Available Slots
export const getSlots = async (req, res) => {
  try {
    const { jobId, timezone } = req.query;
    // Calls the service function
    const slots = await interviewService.getAvailableSlots(jobId, timezone);
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Candidates: Book a Slot
export const bookSlot = async (req, res) => {
  try {
    const { candidateId, slotId, jobId } = req.body;
    
    // Calls the service function to handle the booking logic + email
    const interview = await interviewService.bookInterview(candidateId, slotId, jobId);
    
    res.json({ success: true, interview });
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};