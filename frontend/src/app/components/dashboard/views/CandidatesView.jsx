import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Plus, Brain, FileText, Video } from "lucide-react";
import { Card } from "../shared/Card";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { PIPELINE_STAGES } from "@/app/data/dashboardData";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const CandidatesView = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Talent Pipeline</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Review resumes and manage applicant status</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600">List View</button>
        <button className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-100">Pipeline View</button>
      </div>
    </div>

    <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar">
      {PIPELINE_STAGES.map((stage) => (
        <div key={stage.id} className="min-w-[280px] w-80 shrink-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              {stage.name}
              <span className="text-[10px] bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full font-black">{stage.candidates.length}</span>
            </h3>
            <Plus className="w-4 h-4 text-slate-400 cursor-pointer hover:text-indigo-600" />
          </div>
          
          <div className="space-y-3">
            {stage.candidates.length === 0 ? ( stage.id === 'screening' && (
              <div className="h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-medium italic">
                Drop candidates here
              </div>
            )) : stage.candidates.map((candidate) => (
              <Card key={candidate.id} className="p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-3 mb-3">
                  <ImageWithFallback src={candidate.avatar} alt={candidate.name} className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{candidate.name}</h4>
                    <p className="text-[10px] text-slate-500 truncate">{candidate.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <div className="w-5 h-5 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <FileText className="w-3 h-3" />
                    </div>
                    <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Video className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black text-indigo-600">
                    <Brain className="w-3 h-3" />
                    {candidate.score}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);
