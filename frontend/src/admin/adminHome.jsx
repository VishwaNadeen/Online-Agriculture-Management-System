// src/pages/admin/AdminHome.jsx
import { Link, Outlet } from "react-router-dom";
import { FaUsers, FaBook, FaCalendarAlt, FaComments, FaCog } from "react-icons/fa";

export default function AdminHome() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* ===== Left Sidebar ===== */}
      <aside className="w-64 bg-green-700 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold text-center border-b border-green-600">
          Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/admin/users"
            className="flex items-center gap-2 p-2 rounded hover:bg-green-600"
          >
            <FaUsers /> Users
          </Link>
          <Link
            to="/admin/courses"
            className="flex items-center gap-2 p-2 rounded hover:bg-green-600"
          >
            <FaBook /> Tutorials
          </Link>
          <Link
            to="/admin/appointments"
            className="flex items-center gap-2 p-2 rounded hover:bg-green-600"
          >
            <FaCalendarAlt /> Appointments
          </Link>
          <Link
            to="/admin/community"
            className="flex items-center gap-2 p-2 rounded hover:bg-green-600"
          >
            <FaComments /> Community
          </Link>
          <Link
            to="/admin/settings"
            className="flex items-center gap-2 p-2 rounded hover:bg-green-600"
          >
            <FaCog /> Settings
          </Link>
        </nav>
      </aside>

      {/* ===== Right Content Area ===== */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* This is where child routes will render */}
        <Outlet />
      </main>
    </div>
  );
}
