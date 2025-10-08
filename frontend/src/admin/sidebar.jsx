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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-xs text-gray-500 mt-1">Management Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            to=""
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <FaHome className="text-lg" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <FaUsers className="text-lg" />
            <span>Users</span>
          </NavLink>

          <NavLink
            to="discoveries"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <FaCompass className="text-lg" />
            <span>Discovery</span>
          </NavLink>

          <NavLink
            to="courses"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <FaBook className="text-lg" />
            <span>Tutorials</span>
          </NavLink>

          <NavLink
            to="consultant"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <FaCalendarAlt className="text-lg" />
            <span>Consultant</span>
          </NavLink>

          <NavLink
            to="comments"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <FaComments className="text-lg" />
            <span>Community</span>
          </NavLink>

          <NavLink
            to="event"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <FaCalendar className="text-lg" />
            <span>Events</span>
          </NavLink>
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors duration-200 shadow-sm"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}