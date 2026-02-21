import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

const ScheduleInterview = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null);
  const [booked, setBooked] = useState(false);

  // Data
  const [candidate, setCandidate] = useState(null);
  const [job, setJob] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    loadScheduleData();
  }, [token]);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      
      // 1. Get Candidate and Job from the magic link
      const tokenRes = await axios.get(`${apiUrl}/interviews/schedule/${token}`);
      setCandidate(tokenRes.data.candidate);
      setJob(tokenRes.data.job);

      // 2. Fetch the slots from the endpoint you KNOW works!
      const slotsRes = await axios.get(`${apiUrl}/interviews/slots`);
      
      // Handle depending on if your backend returns an array or an object like { data: [...] }
      const slotsData = Array.isArray(slotsRes.data) ? slotsRes.data : slotsRes.data.data || [];
      
      // Filter out slots that are already booked (optional, if your backend doesn't do it)
      const availableSlots = slotsData.filter(slot => slot.isAvailable !== false);
      setSlots(availableSlots);

    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired scheduling link');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    
    try {
      // 3. Post to your working /book endpoint with the exact payload it expects
      const payload = {
        candidateId: candidate._id || candidate.id,
        jobId: job._id || job.id,
        slotId: selectedSlot
      };

      await axios.post(`${apiUrl}/interviews/book`, payload);
      setBooked(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book interview');
    } finally {
      setBooking(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading available times...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Invalid</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (booked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Interview Booked!</h1>
          <p className="text-gray-500 mb-4">
            You'll receive a confirmation email with the meeting details.
          </p>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-left">
            <p className="text-sm font-medium text-green-800">
              Position: {job?.title}
            </p>
            <p className="text-sm text-green-700 mt-1">
              Check your inbox for the calendar invite.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main scheduling UI
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Schedule Your Interview</h1>
          <p className="text-gray-500 mt-2">
            Hi {candidate?.name}, select a time for your <strong>{job?.title}</strong> interview.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Slot selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Available Times
          </h2>

          {slots.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No available times right now. Please check back later.
            </p>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => {
                // MongoDB uses _id, so we ensure we grab the right identifier
                const slotId = slot._id || slot.id;
                
                return (
                  <button
                    key={slotId}
                    onClick={() => { setSelectedSlot(slotId); setError(null); }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      selectedSlot === slotId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Clock className={`w-5 h-5 ${selectedSlot === slotId ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {format(new Date(slot.startTime), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(slot.startTime), 'h:mm a')} – {format(new Date(slot.endTime), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    {selectedSlot === slotId && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Confirm */}
          {slots.length > 0 && (
            <button
              onClick={handleBook}
              disabled={!selectedSlot || booking}
              className="w-full mt-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {booking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                'Confirm Interview'
              )}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by HireFlow
        </p>
      </div>
    </div>
  );
};

export default ScheduleInterview;