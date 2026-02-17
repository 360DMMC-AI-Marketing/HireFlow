import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { createInterviewSlot, getRecruiterSlots, deleteInterviewSlot, connectGoogleCalendar } from '../../../services/api/InterviewSettingsPage';
import { format } from 'date-fns';

const InterviewSettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Form State
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Slots from backend
  const [slots, setSlots] = useState([]);

  // Fetch existing slots on mount
  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const data = await getRecruiterSlots();
      setSlots(data);
    } catch (err) {
      console.error('Could not load slots:', err);
    }
  };

  const handleConnectGoogle = () => {
    connectGoogleCalendar();
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await deleteInterviewSlot(slotId);
      setSlots(slots.filter(s => s._id !== slotId));
      setMessage({ type: 'success', text: 'Slot deleted' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete slot' });
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Combine date + time into ISO string
      const startDateTime = new Date(`${date}T${startTime}:00Z`); // Simple UTC assumption for demo
      const endDateTime = new Date(`${date}T${endTime}:00Z`);

      const payload = {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      };

      // Call API
      const newSlot = await createInterviewSlot(payload);
      
      setSlots([...slots, newSlot]);
      setMessage({ type: 'success', text: 'Availability slot added!' });
      
      // Reset form
      setStartTime('');
      setEndTime('');
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add slot' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Interview Settings</h1>
        <p className="text-gray-500">Manage your calendar integration and availability slots.</p>
      </div>

      {/* SECTION 1: Google Integration */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Google Calendar</h2>
              <p className="text-sm text-gray-500">Sync interviews directly to your calendar.</p>
            </div>
          </div>
          <button 
            onClick={handleConnectGoogle}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 mr-2" />
            Connect Calendar
          </button>
        </div>
      </div>

      {/* SECTION 2: Availability Manager */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Availability</h2>
        
        {message && (
          <div className={`p-4 mb-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
            {message.text}
          </div>
        )}

        {/* Add Slot Form */}
        <form onSubmit={handleAddSlot} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input 
              type="date" 
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input 
              type="time" 
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input 
              type="time" 
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            {loading ? 'Adding...' : 'Add Slot'}
          </button>
        </form>

        {/* List of Slots */}
        {slots.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Your Availability Slots</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {slots.map((slot) => (
                <div key={slot._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(slot.startTime), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(slot.startTime), 'hh:mm a')} - {format(new Date(slot.endTime), 'hh:mm a')}
                      </p>
                      {!slot.isAvailable && (
                        <span className="text-xs text-orange-500 font-medium">Booked</span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteSlot(slot._id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewSettingsPage;