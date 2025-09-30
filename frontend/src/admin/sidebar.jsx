// src/pages/admin/AdminHome.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FaUsers, FaBook, FaCalendarAlt, FaComments, FaHome, FaSignOutAlt } from "react-icons/fa";

export default function AdminHome() {
  const navigate = useNavigate();

  const linkBase = "flex items-center gap-2 p-2 rounded";
  const hover = "hover:bg-green-600";
  const active = "bg-green-800";

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar (locked) */}
      <aside className="w-64 bg-green-700 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold text-center border-b border-green-600">
          Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {/* dashboard at /admin */}
          <NavLink
            to=""
            end
            className={({ isActive }) => `${linkBase} ${hover} ${isActive ? active : ""}`}
          >
            <FaHome /> Dashboard
          </NavLink>

          <NavLink
            to="users"
            className={({ isActive }) => `${linkBase} ${hover} ${isActive ? active : ""}`}
          >
            <FaUsers /> Users
          </NavLink>

          <NavLink
            to="courses"
            className={({ isActive }) => `${linkBase} ${hover} ${isActive ? active : ""}`}
          >
            <FaBook /> Tutorials
          </NavLink>

          <NavLink
            to="consultant"
            className={({ isActive }) => `${linkBase} ${hover} ${isActive ? active : ""}`}
          >
            <FaCalendarAlt />Consultant
          </NavLink>

          <NavLink
            to="comments"
            className={({ isActive }) => `${linkBase} ${hover} ${isActive ? active : ""}`}
          >
            <FaComments /> Community
          </NavLink>

          <NavLink
            to="event"
            className={({ isActive }) => `${linkBase} ${hover} ${isActive ? active : ""}`}
          >
            <FaComments /> Events
          </NavLink>
        </nav>

        {/* Logout button at bottom */}
        <div className="p-4 border-t border-green-600">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* Right content area */}
      <main className="flex-1 p-6 overflow-y-auto overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
