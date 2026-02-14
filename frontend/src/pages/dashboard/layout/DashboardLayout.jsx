import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import api from "@/utils/axios";

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch fresh user profile on layout mount so TopBar is always up to date
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get('/user/profile');
        if (data?.success && data?.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          window.dispatchEvent(new CustomEvent('userUpdated', { detail: data.user }));
        }
      } catch (err) {
        // Ignore — if token invalid the 401 interceptor handles redirect
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-900">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Bar */}
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <div className="p-4 lg:p-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
