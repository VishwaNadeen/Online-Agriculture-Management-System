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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{title}</span>
        <div className="h-9 w-9 rounded-lg bg-green-50 text-green-700 grid place-items-center">
          <Icon />
        </div>
      </div>
      <div className="mt-2 text-3xl font-semibold text-green-700">{value}</div>
      {warn ? (
        <div className="mt-3 text-xs text-amber-700 bg-amber-50 inline-block px-2 py-1 rounded ring-1 ring-amber-200">
          {warn}
        </div>
      ) : to ? (
        <Link to={to} className="inline-block mt-3 text-sm text-green-700 hover:underline">
          View details →
        </Link>
      ) : null}
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-green-700">Welcome, Admin!</h1>
        <p className="mt-2 text-gray-600">
          This is your main dashboard. From here you can manage users, tutorials, appointments, community posts, and events.
        </p>
      </div>

      <div className="flex items-center justify-end">
        <button
          onClick={refresh}
          className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {(loading ? Array.from({ length: 5 }) : cards).map((c, i) =>
          loading ? (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="mt-3 h-8 w-20 bg-gray-100 rounded" />
              <div className="mt-4 h-4 w-28 bg-gray-100 rounded" />
            </div>
          ) : (
            <StatCard key={c.title} title={c.title} value={c.count} icon={c.icon} to={c.to} warn={c.warn} />
          )
        )}
      </div>
    </div>
  );
}
