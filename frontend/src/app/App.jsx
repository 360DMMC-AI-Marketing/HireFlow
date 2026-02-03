import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Calendar, 
  Video, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  ChevronDown,
  Brain,
  Zap
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { AuthLayout } from "@/app/components/auth/shared/AuthLayout";
import { LoginPage } from "@/app/components/auth/login/LoginPage";
import { SignupPage } from "@/app/components/auth/signup/SignupPage";
import { EmailVerificationView } from "@/app/components/auth/signup/EmailVerificationView";
import { Card } from "@/app/components/dashboard/shared/Card";
import { SidebarItem } from "@/app/components/dashboard/shared/SidebarItem";
import { OverviewView } from "@/app/components/dashboard/views/OverviewView";
import { JobsView } from "@/app/components/dashboard/views/JobsView";
import { CandidatesView } from "@/app/components/dashboard/views/CandidatesView";
import { InterviewsView } from "@/app/components/dashboard/views/InterviewsView";
import { AIVideoView } from "@/app/components/dashboard/views/AIVideoView";
import { AnalyticsView } from "@/app/components/dashboard/views/AnalyticsView";
import { DASHBOARD_STATS, ANALYTICS_DATA, RECENT_CANDIDATES } from "@/app/data/dashboardData";

// --- Main App Component ---

export default function HireFlowDashboard() {
  const [view, setView] = useState("login");
  const [activeTab, setActiveTab] = useState("overview");

  if (view === "login") {
    return (
      <AuthLayout title="Platform Login" subtitle="Secure access to your recruitment command center.">
        <Toaster position="top-center" richColors />
        <LoginPage onSwitch={() => setView("signup")} onLogin={() => setView("dashboard")} />
      </AuthLayout>
    );
  }

  if (view === "signup") {
    return (
      <AuthLayout title="Register Company" subtitle="Join 500+ enterprises optimizing their talent acquisition.">
        <Toaster position="top-center" richColors />
        <SignupPage onSwitch={() => setView("login")} onSignup={() => setView("verify")} />
      </AuthLayout>
    );
  }

  if (view === "verify") {
    return (
      <AuthLayout title="" subtitle="">
        <Toaster position="top-center" richColors />
        <EmailVerificationView onComplete={() => setView("dashboard")} />
      </AuthLayout>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-900">
      <Toaster position="top-center" richColors />
      {/* Navigation Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 z-40 hidden lg:flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10 group cursor-pointer">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-6 transition-transform shadow-lg shadow-indigo-200">
              <Zap className="text-white w-6 h-6 fill-white" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-slate-900">HireFlow</span>
          </div>

          <nav className="space-y-2">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
            <SidebarItem icon={Briefcase} label="Job Management" active={activeTab === "jobs"} onClick={() => setActiveTab("jobs")} />
            <SidebarItem icon={Users} label="Candidates" active={activeTab === "candidates"} onClick={() => setActiveTab("candidates")} />
            <SidebarItem icon={Calendar} label="Interview System" active={activeTab === "interviews"} onClick={() => setActiveTab("interviews")} />
            <SidebarItem icon={Video} label="AI Video Assessment" active={activeTab === "aivideo"} onClick={() => setActiveTab("aivideo")} />
            <SidebarItem icon={BarChart3} label="Analytics" active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} />
          </nav>
        </div>

        <div className="mt-auto p-8">
          <Card className="bg-indigo-900 border-none p-5 mb-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Brain className="w-4 h-4" />
              </div>
              <p className="text-xs font-black uppercase">Pro Plan</p>
            </div>
            <p className="text-xs text-indigo-300 font-medium leading-relaxed">Unlock advanced AI gaze tracking and custom branding.</p>
            <button className="w-full mt-4 py-2 bg-white text-indigo-900 rounded-xl text-xs font-black">
              Upgrade Now
            </button>
          </Card>
          <button 
            onClick={() => setView("login")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-500 hover:bg-slate-100"
          >
            <Settings className="w-5 h-5 text-slate-400" />
            <span className="font-semibold text-sm">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 h-20 flex items-center justify-between z-30">
          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search candidates..." 
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm outline-none font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
              <Bell className="w-5 h-5" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-3 cursor-pointer group">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1769636929261-e913ed023c83?q=80&w=100" 
                alt="Profile" 
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-md shadow-slate-200"
              />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Jordan Smith</p>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && <OverviewView key="overview" dashboardStats={DASHBOARD_STATS} analyticsData={ANALYTICS_DATA} recentCandidates={RECENT_CANDIDATES} />}
              {activeTab === "jobs" && <JobsView key="jobs" />}
              {activeTab === "candidates" && <CandidatesView key="candidates" />}
              {activeTab === "interviews" && <InterviewsView key="interviews" />}
              {activeTab === "aivideo" && <AIVideoView key="aivideo" />}
              {activeTab === "analytics" && <AnalyticsView key="analytics" analyticsData={ANALYTICS_DATA} />}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
