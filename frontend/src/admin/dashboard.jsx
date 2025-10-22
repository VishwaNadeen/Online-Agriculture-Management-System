// src/pages/admin/Dashboard.jsx
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FaUsers, FaBook, FaCalendarAlt, FaComments, FaCalendar } from "react-icons/fa";
import { Link } from "react-router-dom";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/* ----- helpers ----- */
function readAuthToken() {
  const get = (k) => localStorage.getItem(k) ?? sessionStorage.getItem(k);
  return (
    get("auth_token") ||
    get("token") ||
    get("user_token") ||
    get("authToken") ||
    ""
  );
}

// Count items from common shapes
function countFrom(res) {
  if (!res) return 0;
  const d = res.data;
  if (typeof d?.total === "number") return d.total;      // { total, ... }
  if (Array.isArray(d)) return d.length;                 // [ ... ]
  if (Array.isArray(d?.users)) return d.users.length;    // { users: [...] }
  if (Array.isArray(d?.items)) return d.items.length;    // { items: [...] }
  if (Array.isArray(d?.data)) return d.data.length;      // { data: [...] }
  if (Array.isArray(d?.appointments)) return d.appointments.length; // { appointments: [...] }
  if (d?.pagination?.total) return d.pagination.total;   // { pagination: { total: ... } }
  return 0;
}

async function safeGet(path, needsAuth = false) {
  try {
    const token = readAuthToken();
    const headers = needsAuth && token ? { Authorization: `Bearer ${token}` } : undefined;
    const res = await axios.get(`${BASE}${path}`, { headers });
    return { ok: true, count: countFrom(res) };
  } catch (err) {
    console.error(`GET ${path} failed:`, err?.response?.status, err?.response?.data || err?.message);
    return { ok: false, count: 0, message: err?.response?.data?.message || err?.message || "Request failed" };
  }
}

function StatCard({ title, value, icon: Icon, to, warn }) {
  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 hover:bg-white/90">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-600 tracking-wide">{title}</span>
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white grid place-items-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
            <Icon className="text-lg" />
          </div>
        </div>
        
        <div className="mb-4">
          <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
            {value}
          </div>
        </div>
        
        {warn ? (
          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-amber-800 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200/50 shadow-sm">
            <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse" />
            {warn}
          </div>
        ) : to ? (
          <Link 
            to={to} 
            className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors duration-200 group/link"
          >
            View details
            <svg className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: { count: 0, warn: "" },
    courses: { count: 0, warn: "" },
    appointments: { count: 0, warn: "" },
    community: { count: 0, warn: "" },
    events: { count: 0, warn: "" },
  });

  const refresh = async () => {
    setLoading(true);

    const [
      usersRes,
      coursesRes,
      apptRes,
      communityRes,
      eventsRes,
    ] = await Promise.all([
      safeGet("/api/users"),               // userRoutes.js -> router.get("/")
      safeGet("/courses"),                 // server mounts at "/courses"
      safeGet("/api/appointments?limit=1000", true),  // appointmentRoutes.js is protected (router.use(requireAuth))
      safeGet("/community"),               // server mounts at "/community"
      safeGet("/events"),                  // server mounts at "/events"
    ]);

    setStats({
      users:        { count: usersRes.count,       warn: usersRes.ok ? "" : "Users count unavailable" },
      courses:      { count: coursesRes.count,     warn: coursesRes.ok ? "" : "Tutorials count unavailable" },
      appointments: { count: apptRes.count,        warn: apptRes.ok ? "" : "Appointments require login" },
      community:    { count: communityRes.count,   warn: communityRes.ok ? "" : "Community count unavailable" },
      events:       { count: eventsRes.count,      warn: eventsRes.ok ? "" : "Events count unavailable" },
    });

    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const cards = useMemo(() => ([
    { title: "Total Users",     ...stats.users,        icon: FaUsers,       to: "/admin/users" },
    { title: "Tutorials",       ...stats.courses,      icon: FaBook,        to: "/admin/courses" },
    { title: "Appointments",    ...stats.appointments, icon: FaCalendarAlt, to: "/admin/appointments" },
    { title: "Community Posts", ...stats.community,    icon: FaComments,    to: "/admin/comments" },
    { title: "Events",          ...stats.events,       icon: FaCalendar,    to: "/admin/event" },
  ]), [stats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-6 sm:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 bg-clip-text text-transparent mb-3">
                Welcome, Admin!
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                Your comprehensive dashboard for managing users, tutorials, appointments, community posts, and events.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <button
                onClick={refresh}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                disabled={loading}
              >
                <div className="flex items-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Refreshing…</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {(loading ? Array.from({ length: 5 }) : cards).map((c, i) =>
            loading ? (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-4 w-24 bg-gray-200 rounded-lg" />
                  <div className="h-12 w-12 bg-gray-200 rounded-xl" />
                </div>
                <div className="h-10 w-20 bg-gray-200 rounded-lg mb-4" />
                <div className="h-4 w-28 bg-gray-200 rounded-lg" />
              </div>
            ) : (
              <StatCard key={c.title} title={c.title} value={c.count} icon={c.icon} to={c.to} warn={c.warn} />
            )
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Add New Course", to: "/admin/addCourse", icon: "📚", color: "from-blue-500 to-blue-600" },
              { title: "Add New Event", to: "/admin/addevent", icon: "📅", color: "from-purple-500 to-purple-600" },
              { title: "Manage Users", to: "/admin/users", icon: "👥", color: "from-green-500 to-green-600" },
              { title: "View Reports", to: "/admin/consultantReport", icon: "📊", color: "from-orange-500 to-orange-600" },
            ].map((action) => (
              <Link
                key={action.title}
                to={action.to}
                className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} text-white text-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-500">Quick access</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
