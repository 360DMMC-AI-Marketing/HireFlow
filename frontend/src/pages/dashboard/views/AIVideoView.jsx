import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { X, Eye, Brain, Monitor } from "lucide-react";
import { Card } from "../shared/Card";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MetricCard = ({ icon: Icon, label, value, trend, color }) => (
  <div className={cn(
    "p-4 rounded-2xl border flex items-center gap-4",
    color === "blue" && "bg-blue-50/50 border-blue-100",
    color === "purple" && "bg-purple-50/50 border-purple-100",
    color === "emerald" && "bg-emerald-50/50 border-emerald-100"
  )}>
    <div className={cn(
      "p-3 rounded-xl",
      color === "blue" && "bg-blue-100 text-blue-600",
      color === "purple" && "bg-purple-100 text-purple-600",
      color === "emerald" && "bg-emerald-100 text-emerald-600"
    )}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-black text-slate-900">{value}</p>
        {trend && <span className="text-[10px] font-bold text-emerald-600">↑ {trend}</span>}
      </div>
    </div>
  </div>
);

export const AIVideoView = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Video Assessment</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Automated interview insights with gaze tracking</p>
      </div>
      <button className="bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-red-100 hover:bg-red-700 transition-all flex items-center gap-2">
        <Monitor className="w-4 h-4" />
        End Session
      </button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2 p-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
        <div className="relative flex items-center justify-center h-96">
          <div className="w-full h-full bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
            <div className="text-center space-y-4">
              <Monitor className="w-16 h-16 mx-auto text-slate-600" />
              <p className="text-sm font-bold text-slate-400">Video Feed Will Appear Here</p>
            </div>
          </div>
        </div>
        <div className="absolute top-8 right-8 flex gap-2">
          <div className="px-3 py-1.5 bg-red-500 rounded-full text-xs font-black flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            REC
          </div>
          <button className="p-2 bg-slate-800/50 backdrop-blur-sm rounded-lg text-slate-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm rounded-full text-xs font-bold flex items-center gap-2 border border-slate-700">
              <Eye className="w-3 h-3" /> Gaze: 98%
            </div>
            <div className="px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm rounded-full text-xs font-bold flex items-center gap-2 border border-slate-700">
              <Monitor className="w-3 h-3" /> Focus: High
            </div>
          </div>
          <div className="px-4 py-2 bg-slate-800/80 backdrop-blur-sm rounded-xl text-sm font-black border border-slate-700">
            12:34
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <MetricCard icon={Eye} label="Gaze Score" value="98%" trend="12%" color="blue" />
        <MetricCard icon={Brain} label="Confidence" value="High" color="purple" />
        <MetricCard icon={Monitor} label="Frame Rate" value="60fps" color="emerald" />
        
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-4">AI Insights</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs font-bold text-blue-900 mb-2">Strong Eye Contact</p>
              <p className="text-[11px] text-blue-700 leading-relaxed">Candidate maintains consistent eye contact throughout the interview.</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs font-bold text-emerald-900 mb-2">Clear Communication</p>
              <p className="text-[11px] text-emerald-700 leading-relaxed">Speech clarity and pacing are excellent, showing confidence.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
);
