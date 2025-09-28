import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  Star,
  User,
  Phone,
  Mail,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Users,
} from "lucide-react";

/* =========================
   Config
========================= */
const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/* Backend routes from backend/routes/AppointmentRoute.js */
const ENDPOINTS = {
  userBookings: `${BASE}/appointments/my`,             // GET current user's bookings
  myConsultant: `${BASE}/appointments/my-consultant`,  // GET consultant's received appointments
  confirm: (id) => `${BASE}/appointments/${id}/confirm`,
  decline: (id) => `${BASE}/appointments/${id}/decline`,
};

/* =========================
   Small helpers
========================= */
function readAuthUser() {
  try {
    return (
      JSON.parse(localStorage.getItem("auth_user") || "null") ||
      JSON.parse(sessionStorage.getItem("auth_user") || "null")
    );
  } catch {
    return null;
  }
}
function getToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("auth_token") ||
    ""
  );
}
function userIsConsultant(u) {
  if (!u) return false;
  if (u.role === "consultant") return true;
  if (Array.isArray(u.roles) && u.roles.includes("consultant")) return true;
  if (u.consultantProfile?.active) return true;
  return false;
}
const colorStyles = {
  blue: { text: "text-blue-600", bgIcon: "bg-blue-100" },
  green: { text: "text-green-600", bgIcon: "bg-green-100" },
  orange: { text: "text-orange-600", bgIcon: "bg-orange-100" },
  yellow: { text: "text-yellow-600", bgIcon: "bg-yellow-100" },
};

/* =========================
   Reusable UI bits
========================= */
const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue" }) => {
  const cs = colorStyles[color] || colorStyles.blue;
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${cs.text}`}>{value}</p>
          <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-full ${cs.bgIcon}`}>
          <Icon className={`w-6 h-6 ${cs.text}`} />
        </div>
      </div>
    </div>
  );
};

const Stars = ({ value = 0 }) => (
  <div className="flex items-center space-x-1">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < value ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ))}
  </div>
);

const Avatar = ({ src, alt }) => (
  <img
    src={src}
    alt={alt}
    onError={(e) => {
      e.currentTarget.onerror = null;
      e.currentTarget.src =
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='100%' height='100%' fill='#e5e7eb'/><text x='50%' y='55%' text-anchor='middle' fill='#9ca3af' font-size='14' font-family='Arial'>👤</text></svg>`
        );
    }}
    className="w-10 h-10 rounded-full bg-gray-200 object-cover"
  />
);

/* =========================
   User Bookings (non-consultant)
========================= */
function BookingCard({ appt }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar src={appt.consultantAvatar} alt={appt.consultantName} />
          <div>
            <div className="font-semibold text-gray-900">{appt.consultantName}</div>
            <div className="text-sm text-gray-500">
              {new Date(appt.dateISO || appt.date).toLocaleDateString()} • {appt.time} • {appt.duration} min
            </div>
          </div>
        </div>
        <span
          className={
            "px-2 py-1 text-xs rounded-full " +
            (appt.status === "upcoming"
              ? "bg-emerald-100 text-emerald-800"
              : appt.status === "completed"
              ? "bg-gray-100 text-gray-800"
              : "bg-red-100 text-red-700")
          }
        >
          {appt.status?.[0]?.toUpperCase() + appt.status?.slice(1)}
        </span>
      </div>
      {appt.status === "completed" && typeof appt.rating === "number" && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stars value={appt.rating} />
            <span className="text-sm text-gray-600">{appt.rating}/5</span>
          </div>
          {appt.feedback && (
            <span className="text-sm text-gray-600 italic truncate max-w-[60%]">
              “{appt.feedback}”
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MyBookings() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [bookings, setBookings] = useState([]);
  const token = getToken();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const { data } = await axios.get(ENDPOINTS.userBookings, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const items = Array.isArray(data) ? data : data?.items || [];
        if (mounted) setBookings(items);
      } catch (e) {
        if (mounted)
          setErr(e?.response?.data?.message || e.message || "Failed to load your bookings");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  // Backend uses 'confirmed', 'pending', 'declined', 'cancelled', 'completed'
  const upcoming = bookings.filter((b) => (b.status || "").toLowerCase() === "confirmed");
  const completed = bookings.filter((b) => (b.status || "").toLowerCase() === "completed");

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">My Appointments</h1>

      {err && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
          {err}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming</h3>
            </div>
            <div className="p-6 space-y-4">
              {upcoming.length ? (
                upcoming.map((a) => <BookingCard key={a._id || a.id} appt={a} />)
              ) : (
                <p className="text-gray-500">No upcoming appointments.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
            </div>
            <div className="p-6 space-y-4">
              {completed.length ? (
                completed.map((a) => <BookingCard key={a._id || a.id} appt={a} />)
              ) : (
                <p className="text-gray-500">No completed appointments yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* =========================
   Consultant Dashboard (receives appointments)
========================= */
function CApptCard({ appointment }) {
  const isUpcoming = (appointment.status || "").toLowerCase() === "confirmed";
  const dateStr = new Date(appointment.appointmentDate || appointment.dateISO || appointment.date || Date.now()).toLocaleDateString();
  const timeStr = appointment.appointmentTime || appointment.time || "-";
  const duration = appointment.durationHours ?? appointment.duration ?? 60;
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Avatar src={appointment.patientAvatar} alt={appointment.name || appointment.patientName} />
          <div>
            <h4 className="font-semibold text-gray-900">{appointment.name || appointment.patientName}</h4>
            <p className="text-sm text-gray-500">{appointment.category || appointment.type || "Consultation"}</p>
            <p className="text-xs text-gray-500">{dateStr} • {timeStr} • {duration}{typeof duration === "number" ? "h" : ""}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{timeStr}</p>
          <p className="text-xs text-gray-500">{duration}{typeof duration === "number" ? " h" : ""}</p>
        </div>
      </div>

      {isUpcoming ? (
        <div className="flex items-center justify-between">
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Upcoming</span>
          <div className="flex space-x-2">
            <button type="button" title="Call" className="text-blue-600 hover:text-blue-800 text-sm">
              <Phone className="w-4 h-4" />
            </button>
            <button type="button" className="text-gray-600 hover:text-gray-800 text-sm">
              Reschedule
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Completed</span>
            <div className="flex items-center space-x-2">
              <Stars value={appointment.rating || 0} />
              {typeof appointment.rating === "number" && (
                <span className="text-sm text-gray-600">{appointment.rating}/5</span>
              )}
            </div>
          </div>
          {appointment.feedback && (
            <p className="text-sm text-gray-600 italic">"{appointment.feedback}"</p>
          )}
        </div>
      )}
    </div>
  );
}

function ConsultantDashboard({ user }) {
  const token = getToken();

  const [activeTab, setActiveTab] = useState("overview");
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]); // derived from 'pending'
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // fetch helper so we can refresh after actions
  const fetchConsultantAppointments = async () => {
    try {
      setErr("");
      setLoading(true);
      const aRes = await axios.get(ENDPOINTS.myConsultant, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const aItems = Array.isArray(aRes.data) ? aRes.data : aRes.data?.items || [];
      const reqs = aItems.filter((it) => (it.status || "").toLowerCase() === "pending");
      setAppointments(aItems);
      setRequests(reqs);
    } catch (e) {
      setErr(
        e?.response?.data?.message || e.message || "Failed to load consultant dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchConsultantAppointments();
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter((a) => (a.status || "").toLowerCase() === "completed").length;
    const upcoming = appointments.filter((a) => (a.status || "").toLowerCase() === "confirmed").length;
    const ratings = appointments.filter((a) => typeof a.rating === "number");
    const avg =
      ratings.reduce((acc, a) => acc + (a.rating || 0), 0) / (ratings.length || 1) || 0;
    return { total, completed, upcoming, avgRating: avg.toFixed(1) };
  }, [appointments]);

  const upcomingAppointments = [...appointments]
    .filter((a) => (a.status || "").toLowerCase() === "confirmed")
    .sort((a, b) =>
      (String(a.dateISO || a.date) + a.time).localeCompare(String(b.dateISO || b.date) + b.time)
    );

  const completedAppointments = [...appointments]
    .filter((a) => (a.status || "").toLowerCase() === "completed")
    .sort((a, b) =>
      (String(b.dateISO || b.date) + b.time).localeCompare(String(a.dateISO || a.date) + a.time)
    );

  const todaysAppointments = upcomingAppointments.filter(
    (a) => (a.dateISO || a.date)?.slice(0, 10) === todayStr
  );

  const handleRequestAction = async (requestId, action) => {
    try {
      if (action === "accept") {
        await axios.post(ENDPOINTS.confirm(requestId), {}, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } else if (action === "decline") {
        const reason = window.prompt("Reason (optional):") || "";
        await axios.post(ENDPOINTS.decline(requestId), { reason }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      }
      await fetchConsultantAppointments();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to update request");
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-6 text-gray-500">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Dr. {user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Consultant"}
                </h1>
                <p className="text-sm text-gray-600">Business Strategy Consultant</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Mail className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Calendar className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {[
            { id: "overview", label: "Overview", icon: TrendingUp },
            { id: "appointments", label: "Appointments", icon: Calendar },
            { id: "requests", label: "Requests", icon: AlertCircle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
              type="button"
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Appointments" value={`${stats.total}+`} subtitle="All Time" icon={Users} color="blue" />
              <StatCard title="Completed" value={stats.completed} subtitle="Overall" icon={CheckCircle} color="green" />
              <StatCard title="Upcoming" value={stats.upcoming} subtitle="Scheduled" icon={Clock} color="orange" />
              <StatCard title="Average Rating" value={stats.avgRating} subtitle="From Reviews" icon={Star} color="yellow" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Appointments</h3>
                  <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="p-6 space-y-4">
                  {todaysAppointments.slice(0, 3).map((appointment) => (
                    <CApptCard key={appointment._id || appointment.id} appointment={appointment} />
                  ))}
                  {todaysAppointments.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No appointments scheduled for today</p>
                  )}
                </div>
              </div>

              {/* Quick Actions / Reviews */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-6 space-y-3">
                  <button type="button" className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Block Time Slot
                  </button>
                  <button type="button" className="w-full bg-gray-100 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                    View Calendar
                  </button>
                  <button type="button" className="w-full bg-gray-100 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                    Update Availability
                  </button>
                </div>

                <div className="px-6 pb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Recent Reviews</h4>
                  <div className="space-y-3">
                    {completedAppointments.slice(0, 2).map((appointment) => (
                      <div key={appointment._id || appointment.id} className="border-l-4 border-green-400 pl-3">
                        <div className="flex items-center space-x-1 mb-1">
                          <Stars value={appointment.rating || 0} />
                        </div>
                        {appointment.feedback && (
                          <p className="text-xs text-gray-600">"{appointment.feedback}"</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">- {appointment.patientName}</p>
                      </div>
                    ))}
                    {completedAppointments.length === 0 && <p className="text-xs text-gray-500">No reviews yet.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointments */}
        {activeTab === "appointments" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Confirmed Appointments</h3>
              </div>
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {upcomingAppointments.length ? (
                  upcomingAppointments.map((a) => <CApptCard key={a._id || a.id} appointment={a} />)
                ) : (
                  <p className="text-gray-500 text-center py-8">No upcoming appointments</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Recent Completed</h3>
              </div>
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {completedAppointments.length ? (
                  completedAppointments.map((a) => <CApptCard key={a._id || a.id} appointment={a} />)
                ) : (
                  <p className="text-gray-500 text-center py-8">No completed appointments yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Requests */}
        {activeTab === "requests" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Appointment Requests</h3>
              <p className="text-sm text-gray-600 mt-1">Review and respond to consultation requests</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.length ? (
                  requests.map((r) => (
                    <div key={r._id || r.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Avatar src={r.patientAvatar} alt={r.name || r.patientName} />
                          <div>
                            <h4 className="font-semibold text-gray-900">{r.name || r.patientName}</h4>
                            <p className="text-sm text-gray-500">{r.category || r.type || "Consultation"}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(r.appointmentDate).toLocaleDateString()} • {r.appointmentTime}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Pending</span>
                      </div>

                      <div className="text-sm text-gray-600 mb-3 space-y-1">
                        {r.notes && <p>"{r.notes}"</p>}
                        <p className="text-xs text-gray-500">{r.email} • {r.phone}</p>
                        {r.city && <p className="text-xs text-gray-500">{r.city}</p>}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          className="flex-1 bg-green-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-green-700"
                          onClick={() => handleRequestAction(r._id || r.id, "accept")}
                        >
                          Accept
                        </button>
                        <button
                          className="flex-1 bg-gray-200 text-gray-800 text-sm py-2 px-3 rounded-lg hover:bg-gray-300"
                          onClick={() => handleRequestAction(r._id || r.id, "decline")}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-12 col-span-full">No pending requests</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================
   Wrapper: pick view based on role
========================= */
export default function MyAppointments() {
  const user = readAuthUser();
  const isConsultant = userIsConsultant(user);
  if (isConsultant) return <ConsultantDashboard user={user} />;
  return <MyBookings />;
}
