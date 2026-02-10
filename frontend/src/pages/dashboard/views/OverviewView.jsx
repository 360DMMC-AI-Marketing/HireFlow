import React, { useState, useEffect } from "react";
import axios from "axios";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { TrendingUp, Briefcase, Users, Calendar, UserCheck } from "lucide-react";
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip
} from "recharts";
import { Card } from "../shared/Card";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { DASHBOARD_STATS, ANALYTICS_DATA, RECENT_CANDIDATES } from "@/utils/data/dashboardData";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const OverviewView = () => {
  const [dashboardStats, setDashboardStats] = useState(DASHBOARD_STATS);
  const [analyticsData, setAnalyticsData] = useState(ANALYTICS_DATA);
  const [recentCandidates, setRecentCandidates] = useState(RECENT_CANDIDATES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // If no token, use fallback data
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all dashboard data in parallel
      const [statsRes, velocityRes, candidatesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/analytics/dashboard-stats', { headers }).catch(() => null),
        axios.get('http://localhost:5000/api/analytics/application-velocity', { headers }).catch(() => null),
        axios.get('http://localhost:5000/api/analytics/recent-candidates', { headers }).catch(() => null)
      ]);

      // Update dashboard stats
      if (statsRes?.data?.success) {
        const stats = statsRes.data.stats;
        setDashboardStats([
          { 
            label: "Active Jobs", 
            value: String(stats.activeJobs.value), 
            change: stats.activeJobs.change, 
            icon: Briefcase, 
            color: "text-blue-600", 
            bg: "bg-blue-50" 
          },
          { 
            label: "New Applicants", 
            value: String(stats.newApplicants.value), 
            change: stats.newApplicants.change, 
            icon: Users, 
            color: "text-indigo-600", 
            bg: "bg-indigo-50" 
          },
          { 
            label: "Interviews", 
            value: String(stats.interviews.value), 
            change: stats.interviews.change, 
            icon: Calendar, 
            color: "text-purple-600", 
            bg: "bg-purple-50" 
          },
          { 
            label: "Hired", 
            value: String(stats.hired.value), 
            change: stats.hired.change, 
            icon: UserCheck, 
            color: "text-emerald-600", 
            bg: "bg-emerald-50" 
          }
        ]);
      }

      // Update analytics data
      if (velocityRes?.data?.success) {
        setAnalyticsData(velocityRes.data.data);
      }

      // Update recent candidates
      if (candidatesRes?.data?.success) {
        setRecentCandidates(candidatesRes.data.candidates);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Keep using fallback data on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {dashboardStats.map((stat, i) => (
        <Card key={i} className="p-6 hover:border-indigo-200 transition-colors cursor-default group">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
              {stat.change}
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</h3>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-900">Application Velocity</h3>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-400 uppercase">Growth trend</span>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData}>
              <defs>
                <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="applicants" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorApp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold text-slate-900 mb-6">Active Pipeline</h3>
        <div className="space-y-6">
          {recentCandidates.map((candidate) => (
            <div key={candidate.id} className="flex items-center gap-4 group">
              <div className="relative">
                <ImageWithFallback 
                  src={candidate.avatar} 
                  alt={candidate.name} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-white ring-1 ring-slate-100"
                />
                <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full ring-1 ring-slate-100">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-sm truncate">{candidate.name}</h4>
                <p className="text-slate-500 text-xs truncate">{candidate.role}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{candidate.score}%</p>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-8 py-3 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl border border-slate-100 transition-all">
          View All Candidates
        </button>
      </Card>
    </div>
  </div>
  );
};
