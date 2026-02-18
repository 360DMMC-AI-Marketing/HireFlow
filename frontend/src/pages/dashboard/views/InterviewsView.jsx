import React, { useState, useEffect } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNavigate } from "react-router-dom";
import { 
  Mail, ChevronRight, CheckCircle2, CalendarDays, ArrowRight, Settings, 
  Video, Phone, MapPin, X, RefreshCw, Loader2, Clock, AlertCircle, 
  ChevronLeft 
} from "lucide-react";
import { Card } from "../shared/Card";
import { getInterviews, cancelInterview } from "../../../services/api/InterviewSettingsPage";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const InterviewsView = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchInterviews();
  }, [statusFilter]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      const data = await getInterviews(filters);
      setInterviews(data);
    } catch (err) {
      console.error('Failed to load interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (interviewId) => {
    if (!confirm('Cancel this interview?')) return;
    setActionLoading(interviewId);
    try {
      await cancelInterview(interviewId, 'Cancelled by recruiter');
      setInterviews(prev => prev.map(i => 
        i._id === interviewId ? { ...i, status: 'Cancelled' } : i
      ));
    } catch (err) {
      console.error('Cancel failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Video': return <Video className="w-4 h-4" />;
      case 'Phone': return <Phone className="w-4 h-4" />;
      case 'Onsite': return <MapPin className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      case 'NoShow': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getDayLabel = (dateStr) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEEE, MMM d');
  };

  // Group interviews by day
  const grouped = interviews.reduce((acc, interview) => {
    const day = interview.scheduledAt ? format(parseISO(interview.scheduledAt), 'yyyy-MM-dd') : 'unscheduled';
    if (!acc[day]) acc[day] = [];
    acc[day].push(interview);
    return acc;
  }, {});
  const sortedDays = Object.keys(grouped).sort();

  return (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interview System</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Manage scheduled interviews & calendar sync</p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => navigate('/dashboard/interviews/settings')}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email Templates
        </button>
      </div>
    </div>

    {/* Status Filters */}
    <div className="flex gap-2">
      {['', 'Scheduled', 'Completed', 'Cancelled', 'NoShow'].map(s => (
        <button
          key={s}
          onClick={() => setStatusFilter(s)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
            statusFilter === s 
              ? "bg-indigo-600 text-white border-indigo-600" 
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          )}
        >
          {s || 'All'}
        </button>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Interview List */}
      <Card className="lg:col-span-2 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-900">
            Interviews {interviews.length > 0 && <span className="text-slate-400 font-normal">({interviews.length})</span>}
          </h3>
          <button 
            onClick={fetchInterviews}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        ) : interviews.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No interviews {statusFilter ? `with status "${statusFilter}"` : 'scheduled yet'}</p>
            <p className="text-slate-400 text-sm mt-1">Go to a candidate and click "Schedule Interview" to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDays.map(day => (
              <div key={day}>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                  {day === 'unscheduled' ? 'Unscheduled' : getDayLabel(day)}
                </p>
                <div className="space-y-3">
                  {grouped[day].map(interview => {
                    const isActive = interview.status === 'Scheduled';
                    const scheduledAt = interview.scheduledAt ? parseISO(interview.scheduledAt) : null;
                    return (
                      <div
                        key={interview._id}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                          isActive ? "bg-indigo-50/50 border-indigo-100" : "bg-slate-50/50 border-slate-100"
                        )}
                      >
                        {/* Time */}
                        <div className="w-14 h-14 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm shrink-0">
                          {scheduledAt ? (
                            <>
                              <span className="text-xs font-black text-indigo-600">{format(scheduledAt, 'h:mm')}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase">{format(scheduledAt, 'a')}</span>
                            </>
                          ) : (
                            <Clock className="w-4 h-4 text-slate-300" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {interview.candidateId?.name || 'Unknown Candidate'}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">
                            {interview.interviewType || 'Video'} • {interview.jobId?.title || 'N/A'}
                            {interview.duration && ` • ${interview.duration}min`}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border", getStatusStyle(interview.status))}>
                          {interview.status}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isActive && interview.meetingLink && (
                            <a
                              href={interview.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition"
                            >
                              Join
                            </a>
                          )}
                          {isActive && (
                            <button
                              onClick={() => handleCancel(interview._id)}
                              disabled={actionLoading === interview._id}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                              title="Cancel"
                            >
                              {actionLoading === interview._id 
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <X className="w-4 h-4" />
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Right sidebar */}
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-4">Automation Loops</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></div>
                <span className="text-xs font-bold text-slate-700">Interview Reminder</span>
              </div>
              <div className="w-8 h-4 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" /></div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Mail className="w-4 h-4" /></div>
                <span className="text-xs font-bold text-slate-700">Follow-up Sequence</span>
              </div>
              <div className="w-8 h-4 bg-slate-200 rounded-full relative"><div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" /></div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-slate-900 text-white overflow-hidden relative">
          <CalendarDays className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5" />
          <h3 className="font-bold mb-2">Calendar Sync</h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">Connect your Google or Outlook calendar to automate scheduling links.</p>
          <button 
            onClick={() => navigate('/dashboard/interviews/settings')}
            className="w-full py-2.5 bg-white text-slate-900 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
          >
            Connect Calendar <ArrowRight className="w-3 h-3" />
          </button>
        </Card>
      </div>
    </div>
  </div>
  );
};
