import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FaUsers, FaBook, FaCalendarAlt, FaComments, FaHome, FaSignOutAlt, FaCompass, FaCalendar } from "react-icons/fa";

export default function AdminHome() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100/90 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-xl shadow-gray-500/10">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-gray-100/60">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaHome className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">Admin Panel</h1>
              <p className="text-xs text-emerald-600 font-medium">Management Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to=""
            end
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 transform scale-105"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100/50 hover:text-emerald-700 hover:shadow-md"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <FaHome className={`text-lg transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="transition-all duration-300">Dashboard</span>
                {isActive && (
                  <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="users"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 transform scale-105"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/50 hover:text-blue-700 hover:shadow-md"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <FaUsers className={`text-lg transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="transition-all duration-300">Users</span>
                {isActive && (
                  <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="courses"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 ${
                isActive
                  ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 transform scale-105"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 hover:text-purple-700 hover:shadow-md"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <FaBook className={`text-lg transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="transition-all duration-300">Tutorials</span>
                {isActive && (
                  <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="consultant"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 ${
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 transform scale-105"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100/50 hover:text-orange-700 hover:shadow-md"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <FaCalendarAlt className={`text-lg transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="transition-all duration-300">Consultant</span>
                {isActive && (
                  <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="comments"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 ${
                isActive
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25 transform scale-105"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100/50 hover:text-green-700 hover:shadow-md"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <FaComments className={`text-lg transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="transition-all duration-300">Community</span>
                {isActive && (
                  <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="event"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 ${
                isActive
                  ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/25 transform scale-105"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-pink-100/50 hover:text-pink-700 hover:shadow-md"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <FaCalendar className={`text-lg transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="transition-all duration-300">Events</span>
                {isActive && (
                  <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </>
            )}
          </NavLink>
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/60 to-gray-100/40">
          <button
            onClick={handleLogout}
            className="group w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-medium transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30"
          >
            <FaSignOutAlt className="transition-all duration-300 group-hover:scale-110" />
            <span className="transition-all duration-300">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50/50 via-white to-emerald-50/20">
        <div className="p-8 animate-fadeIn">
          <Outlet />
        </div>
      </main>
    </div>
  );
}