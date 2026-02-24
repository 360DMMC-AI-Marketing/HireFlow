import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, CheckCircle, AlertCircle, Globe, CalendarRange } from 'lucide-react';
import { createInterviewSlot, getRecruiterSlots, deleteInterviewSlot } from '../../../services/api/InterviewSettingsPage';
import { format } from 'date-fns';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata',
  'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland'
];

const DURATIONS = [15, 30, 45, 60, 90, 120];
const WEEKDAYS = [
  { label: 'S', value: 0 }, { label: 'M', value: 1 }, { label: 'T', value: 2 },
  { label: 'W', value: 3 }, { label: 'T', value: 4 }, { label: 'F', value: 5 }, { label: 'S', value: 6 }
];

const InterviewSettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // Default: Mon - Fri
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [duration, setDuration] = useState(30); // Default to 30 mins like Calendly

  // Slots from backend
  const [slots, setSlots] = useState([]);

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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiUrl}/integrations/google`;
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

  const toggleDay = (dayValue) => {
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(selectedDays.filter(d => d !== dayValue));
    } else {
      setSelectedDays([...selectedDays, dayValue]);
    }
  };

  // Calendly-Style Bulk Date Range Generator
  const handleAddSlot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!startDate || !endDate || !startTime || !endTime) {
        setMessage({ type: 'error', text: 'Please fill out all date and time fields.' });
        setLoading(false);
        return;
      }

      if (selectedDays.length === 0) {
        setMessage({ type: 'error', text: 'Please select at least one day of the week.' });
        setLoading(false);
        return;
      }

      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T23:59:59`);

      if (end < start) {
        setMessage({ type: 'error', text: 'End date must be after start date.' });
        setLoading(false);
        return;
      }

      let currentDay = new Date(start);
      const allPromises = [];

      // 1. Loop through every single day in the date range
      while (currentDay <= end) {
        const dayOfWeek = currentDay.getDay();

        // 2. Check if the recruiter selected this day of the week (e.g., is it a Monday?)
        if (selectedDays.includes(dayOfWeek)) {
          const dateString = currentDay.toISOString().split('T')[0];
          
          const blockStart = new Date(`${dateString}T${startTime}:00`);
          const blockEnd = new Date(`${dateString}T${endTime}:00`);

          let currentChunk = new Date(blockStart);

          // 3. Chop this specific day into smaller slots based on duration
          while (currentChunk < blockEnd) {
            const chunkEnd = new Date(currentChunk.getTime() + duration * 60 * 1000);
            if (chunkEnd > blockEnd) break;

            const payload = {
              startTime: currentChunk.toISOString(),
              endTime: chunkEnd.toISOString(),
              timezone,
            };

            // Queue up the API call
            allPromises.push(createInterviewSlot(payload));
            
            currentChunk = new Date(chunkEnd);
          }
        }
        // Move to the very next calendar day
        currentDay.setDate(currentDay.getDate() + 1);
      }

      if (allPromises.length === 0) {
        setMessage({ type: 'error', text: 'No slots matched your selected days in that range.' });
        setLoading(false);
        return;
      }

      if (allPromises.length > 150) {
         if (!window.confirm(`You are about to generate ${allPromises.length} individual slots. This might take a few seconds. Proceed?`)) {
             setLoading(false);
             return;
         }
      }

      // Fire all API calls to save the slots
      const generatedSlots = await Promise.all(allPromises);

      setSlots([...slots, ...generatedSlots]);
      setMessage({ type: 'success', text: `Success! Generated ${generatedSlots.length} available slots.` });
      
      // Reset form
      setStartDate('');
      setEndDate('');
      setStartTime('');
      setEndTime('');
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to generate slots' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Interview Settings</h1>
        <p className="text-gray-500">Manage your calendar integration, timezone, and availability slots.</p>
      </div>

      {/* SECTION 1 & 2: Integration & Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Google Calendar</h2>
                <p className="text-sm text-gray-500">Sync directly to your calendar.</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleConnectGoogle}
            className="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 mr-2" />
            Connect Calendar
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Scheduling Preferences
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slot Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {DURATIONS.map(d => (
                  <option key={d} value={d}>{d} minutes</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Calendly-Style Bulk Availability Builder */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center">
          <CalendarRange className="w-5 h-5 mr-2 text-blue-600" />
          Set Recurring Availability
        </h2>
        <p className="text-sm text-gray-500 mb-6">Select a date range and your daily working hours to generate slots.</p>
        
        {message && (
          <div className={`p-4 mb-6 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleAddSlot} className="space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Days of the week selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Active Days</label>
            <div className="flex space-x-2">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`w-10 h-10 rounded-full font-medium text-sm transition-all ${
                    selectedDays.includes(day.value)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours (Start)</label>
              <input 
                type="time" 
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours (End)</label>
              <input 
                type="time" 
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">Generating...</span>
            ) : (
              <span className="flex items-center"><Plus className="w-5 h-5 mr-2" /> Generate Availability Slots</span>
            )}
          </button>
        </form>
      </div>

      {/* List of Generated Slots */}
      {slots.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Slots ({slots.length})</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-2">
            {slots.map((slot) => (
              <div key={slot._id} className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {format(new Date(slot.startTime), 'MMM dd')}
                  </span>
                  <button 
                    onClick={() => handleDeleteSlot(slot._id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center text-xs text-gray-600 mb-1">
                  <Clock className="w-3 h-3 mr-1" />
                  {format(new Date(slot.startTime), 'hh:mm a')} - {format(new Date(slot.endTime), 'hh:mm a')}
                </div>
                {!slot.isAvailable && (
                  <span className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded-md inline-block mt-2 text-center">
                    Booked
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSettingsPage;