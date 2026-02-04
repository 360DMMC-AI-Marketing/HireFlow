import { Outlet, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

function MainLayout() {
  const navigate = useNavigate();

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
