import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNavigate } from "react-router-dom";
import { Mail, ChevronRight, CheckCircle2, CalendarDays, ArrowRight, Settings } from "lucide-react";
import { Card } from "../shared/Card";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const InterviewsView = () => {
  const navigate = useNavigate();

  return (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interview System</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Calendar sync & automated email sequences</p>
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

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-900">Weekly Schedule</h3>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all"><ChevronRight className="w-4 h-4 rotate-180" /></button>
            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} className="text-center">
              <p className="text-[10px] font-black text-slate-400 mb-2">{day}</p>
              <div className={cn(
                "h-24 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-1",
                i === 2 ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-slate-50"
              )}>
                <span className="text-lg font-bold">{20 + i}</span>
                {i % 3 === 0 && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm">
              <span className="text-xs font-black text-indigo-600">10:00</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">AM</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900">Technical Interview: Alex Rivera</h4>
              <p className="text-xs text-slate-500">Video Session • Senior Frontend Engineer</p>
            </div>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm">Join</button>
          </div>
        </div>
      </Card>

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
