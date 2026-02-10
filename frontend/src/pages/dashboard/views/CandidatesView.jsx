import React, { useState } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  Plus, Brain, FileText, Video, LayoutGrid, List, 
  MoreHorizontal, Calendar, Mail, Phone 
} from "lucide-react";
import { Card } from "../shared/Card"; // Assuming you have this
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { PIPELINE_STAGES } from "@/utils/data/dashboardData";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const CandidatesView = () => {
  // ✅ State to toggle between 'pipeline' (Board) and 'list' (Table)
  const [viewMode, setViewMode] = useState('pipeline');

  // ✅ Helper to flatten data for the Table View
  // We take the nested structure and turn it into a flat array of candidates
  const allCandidates = PIPELINE_STAGES.flatMap(stage => 
    stage.candidates.map(candidate => ({
      ...candidate,
      stageName: stage.name,
      stageId: stage.id
    }))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
      
      {/* HEADER & TOGGLE BUTTONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Talent Pipeline</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {viewMode === 'pipeline' ? 'Drag and drop to move candidates' : 'Manage all applicants in a list'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              viewMode === 'list' 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <List className="w-4 h-4" />
            List View
          </button>
          <button 
            onClick={() => setViewMode('pipeline')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              viewMode === 'pipeline' 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Pipeline
          </button>
        </div>
      </div>

      {/* =========================================================
          MODE 1: PIPELINE VIEW (Your original Kanban Board)
         ========================================================= */}
      {viewMode === 'pipeline' && (
        <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage.id} className="min-w-[280px] w-80 shrink-0">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  {stage.name}
                  <span className="text-[10px] bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full font-black">
                    {stage.candidates.length}
                  </span>
                </h3>
                <Plus className="w-4 h-4 text-slate-400 cursor-pointer hover:text-indigo-600" />
              </div>
              
              <div className="space-y-3">
                {stage.candidates.length === 0 ? (stage.id === 'screening' && (
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
                        {candidate.score}%
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================
          MODE 2: LIST VIEW (The New Table)
         ========================================================= */}
      {viewMode === 'list' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">AI Score</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Applied Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-50/50 transition-colors group">
                    
                    {/* Name & Avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback src={candidate.avatar} alt={candidate.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{candidate.name}</p>
                          <p className="text-xs text-slate-500">{candidate.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700">{candidate.role}</span>
                    </td>

                    {/* Stage Badge */}
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border",
                        candidate.stageId === 'hired' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        candidate.stageId === 'rejected' ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-indigo-50 text-indigo-700 border-indigo-200"
                      )}>
                        {candidate.stageName}
                      </span>
                    </td>

                    {/* AI Score */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Brain className={cn(
                          "w-4 h-4",
                          candidate.score >= 80 ? "text-emerald-500" :
                          candidate.score >= 50 ? "text-amber-500" : "text-red-500"
                        )} />
                        <span className="text-sm font-bold text-slate-700">{candidate.score}%</span>
                      </div>
                    </td>

                    {/* Date (Dummy Data) */}
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Oct 24, 2024
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Email">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Profile">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};