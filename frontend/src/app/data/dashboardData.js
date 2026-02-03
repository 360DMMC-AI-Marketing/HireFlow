import { Briefcase, Users, Calendar, UserCheck } from "lucide-react";

export const DASHBOARD_STATS = [
  { label: "Active Jobs", value: "12", change: "+2", icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "New Applicants", value: "148", change: "+24%", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "Interviews", value: "8", change: "Today", icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Hired", value: "4", change: "This Month", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
];

export const ANALYTICS_DATA = [
  { name: "Mon", applicants: 45, hires: 2 },
  { name: "Tue", applicants: 52, hires: 1 },
  { name: "Wed", applicants: 38, hires: 4 },
  { name: "Thu", applicants: 65, hires: 3 },
  { name: "Fri", applicants: 48, hires: 2 },
  { name: "Sat", applicants: 24, hires: 0 },
  { name: "Sun", applicants: 18, hires: 1 },
];

export const RECENT_CANDIDATES = [
  { id: 1, name: "Alex Rivera", role: "Senior Frontend Engineer", status: "Interviewing", score: 92, avatar: "https://images.unsplash.com/photo-1595436222774-4b1cd819aada?q=80&w=200" },
  { id: 2, name: "Sarah Chen", role: "Product Designer", status: "Technical Review", score: 88, avatar: "https://images.unsplash.com/photo-1623594675959-02360202d4d6?q=80&w=200" },
  { id: 3, name: "Marcus Wright", role: "DevOps Architect", status: "Applied", score: 75, avatar: "https://images.unsplash.com/photo-1769636929261-e913ed023c83?q=80&w=200" },
];

export const JOBS = [
  { id: 1, title: "Lead Software Engineer", dept: "Engineering", type: "Remote", applicants: 42, status: "Active" },
  { id: 2, title: "Senior UI/UX Designer", dept: "Design", type: "Hybrid", applicants: 28, status: "Active" },
  { id: 3, title: "Backend Specialist", dept: "Engineering", type: "On-site", applicants: 15, status: "Paused" },
];

export const PIPELINE_STAGES = [
  { id: "applied", name: "Applied", candidates: [RECENT_CANDIDATES[2]] },
  { id: "screening", name: "Screening", candidates: [] },
  { id: "interview", name: "Interview", candidates: [RECENT_CANDIDATES[0]] },
  { id: "offer", name: "Offer", candidates: [RECENT_CANDIDATES[1]] },
];
