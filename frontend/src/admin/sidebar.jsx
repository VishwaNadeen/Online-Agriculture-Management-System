// src/pages/admin/AdminHome.jsx
import { NavLink, Outlet } from "react-router-dom";
import { FaUsers, FaBook, FaCalendarAlt, FaComments, FaCog, FaHome } from "react-icons/fa";

export default function AdminHome() {
  const linkBase = "flex items-center gap-2 p-2 rounded";
  const hover = "hover:bg-green-600";
  const active = "bg-green-800";

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
            to="."
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
            to="appointments"
            className={({ isActive }) => `${linkBase} ${hover} ${isActive ? active : ""}`}
          >
            <FaCalendarAlt /> Appointments
          </NavLink>

          <NavLink
            to="comments"
            className={({ isActive }) => `${linkBase} ${hover} ${isActive ? active : ""}`}
          >
            <FaComments /> Community
          </NavLink>

          <NavLink
            to="events"
            className={({ isActive }) => `${linkBase} ${hover} ${isActive ? active : ""}`}
          >
            <FaComments /> Events
          </NavLink>

          <NavLink
            to="settings"
            className={({ isActive }) => `${linkBase} ${hover} ${isActive ? active : ""}`}
          >
            <FaCog /> Settings
          </NavLink>
        </nav>
      </aside>

      {/* Right content area */}
      <main className="flex-1 p-6 overflow-y-auto overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
