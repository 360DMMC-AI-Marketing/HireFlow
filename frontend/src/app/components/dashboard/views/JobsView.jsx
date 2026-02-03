import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Plus, Briefcase, Globe, Users, Linkedin, MoreHorizontal } from "lucide-react";
import { Card } from "../shared/Card";
import { JOBS } from "@/app/data/dashboardData";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const JobsView = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Job Management</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Multi-platform distribution & internal tracking</p>
      </div>
      <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
        <Plus className="w-4 h-4" />
        Post New Job
      </button>
    </div>

    <div className="grid grid-cols-1 gap-4">
      {JOBS.map((job) => (
        <Card key={job.id} className="p-6 flex flex-col md:flex-row md:items-center gap-6 group hover:border-indigo-200 transition-all">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{job.title}</h3>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                job.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
              )}>
                {job.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 text-sm">
              <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.dept}</span>
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> {job.type}</span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {job.applicants} Applicants</span>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase mr-2">Marketplace Sync</p>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                  <Linkedin className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 cursor-pointer hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
            </div>
            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  </div>
);
