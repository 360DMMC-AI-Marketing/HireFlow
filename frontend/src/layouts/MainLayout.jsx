import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // If not authenticated and trying to access protected routes, redirect to login
    if (!token && !user && location.pathname !== '/login' && location.pathname !== '/signup') {
      navigate("/login", { replace: true });
    }
  }, [location, navigate]);

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className="p-8 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header / Navbar */}
        <div className="flex justify-end mb-6">
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg"
          >
            Logout
          </button>
        </div>

        <AnimatePresence mode="wait">
          <Outlet />
        </AnimatePresence>

      </div>
    </div>
  );
}

export default MainLayout;
