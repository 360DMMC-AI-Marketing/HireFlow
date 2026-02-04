import React from "react";
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Calendar, 
  Video, 
  BarChart3, 
  Settings,
  Zap,
  Brain,
  X
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarItem } from "../shared/SidebarItem";
import { Card } from "../shared/Card";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "jobs", label: "Job Management", icon: Briefcase, path: "/dashboard/jobs" },
  { id: "candidates", label: "Candidates", icon: Users, path: "/dashboard/candidates" },
  { id: "interviews", label: "Interview System", icon: Calendar, path: "/dashboard/interviews" },
  { id: "aivideo", label: "AI Video Assessment", icon: Video, path: "/dashboard/ai-video" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/dashboard/analytics" }
];

export const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose(); // Close mobile menu after navigation
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 z-50 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="p-8">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => handleNavigation("/dashboard")}>
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-6 transition-transform shadow-lg shadow-indigo-200">
                <Zap className="text-white w-6 h-6 fill-white" />
              </div>
              <span className="font-black text-2xl tracking-tighter text-slate-900">HireFlow</span>
            </div>
            {/* Mobile Close Button */}
            <button 
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
              />
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto p-8">
          <Card className="bg-indigo-900 border-none p-5 mb-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Brain className="w-4 h-4" />
              </div>
              <p className="text-xs font-black uppercase">Pro Plan</p>
            </div>
            <p className="text-xs text-indigo-300 font-medium leading-relaxed">
              Unlock advanced AI gaze tracking and custom branding.
            </p>
            <button className="w-full mt-4 py-2 bg-white text-indigo-900 rounded-xl text-xs font-black">
              Upgrade Now
            </button>
          </Card>
          <button 
            onClick={() => handleNavigation("/dashboard/settings")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-500 hover:bg-slate-100"
          >
            <Settings className="w-5 h-5 text-slate-400" />
            <span className="font-semibold text-sm">Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
};
