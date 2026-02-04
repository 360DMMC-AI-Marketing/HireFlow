import React from "react";
import { Search, Bell, ChevronDown, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";

export const TopBar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 lg:px-8 h-20 flex items-center justify-between z-30">
      {/* Mobile Menu Button */}
      <button 
        onClick={onMenuClick}
        className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Menu className="w-6 h-6 text-slate-600" />
      </button>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl hidden md:block lg:ml-0 ml-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search candidates..." 
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm outline-none font-medium"
          />
        </div>
      </div>

      {/* Right Side - Notifications & User Menu */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Notifications */}
        <button className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
          <Bell className="w-5 h-5" />
          <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
        
        <div className="h-8 w-px bg-slate-200 hidden sm:block" />
        
        {/* User Menu */}
        <div className="relative">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <ImageWithFallback 
              src="https://images.unsplash.com/photo-1769636929261-e913ed023c83?q=80&w=100" 
              alt="Profile" 
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-md shadow-slate-200"
            />
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Jordan Smith</p>
              <p className="text-xs text-slate-500">Admin</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 hidden sm:block transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </div>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900">Jordan Smith</p>
                  <p className="text-xs text-slate-500">jordan@company.com</p>
                </div>
                <button 
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/dashboard/settings');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Settings
                </button>
                <button 
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/dashboard/profile');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Profile
                </button>
                <div className="border-t border-slate-100 my-2" />
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
