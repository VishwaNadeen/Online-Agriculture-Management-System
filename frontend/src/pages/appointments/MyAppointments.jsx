// src/pages/appointments/MyAppointments.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import AppointmentCard from "../../components/appointmentCard.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import {
  Calendar,
  Clock,
  Star,
  User,
  Phone,
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
  confirm:   (id) => `${BASE}/appointments/${id}/confirm`,
  decline:   (id) => `${BASE}/appointments/${id}/decline`,
  complete:  (id) => `${BASE}/appointments/${id}/complete`,
  cancel:    (id) => `${BASE}/appointments/${id}/cancel`,
  remove:    (id) => `${BASE}/appointments/${id}`,      // DELETE completed appointment
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
function useRevealOnEnter(options = { threshold: 0.1 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.unobserve(e.target);
        }
      });
    }, options);
    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);
  return { ref, visible };
}

const CountUp = ({ end = 0, duration = 900 }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Number(end) || 0;
    const anim = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setVal(Math.round(from + (to - from) * p));
      if (p < 1) requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }, [end, duration]);
  return <>{val}</>;
};

const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue" }) => {
  const cs = colorStyles[color] || colorStyles.blue;
  const { ref, visible } = useRevealOnEnter();
  const numeric = typeof value === "number" || /^(\d+)(\+?)$/.test(String(value));
  const suffix = typeof value === "string" && value.endsWith("+") ? "+" : "";
  const endVal = typeof value === "string" ? parseInt(value) || 0 : value;
  return (
    <div
      ref={ref}
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all duration-700 transform hover:-translate-y-0.5 hover:shadow-md ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${cs.text}`}>
            {numeric ? (
              <>
                <CountUp end={endVal} />{suffix}
              </>
            ) : (
              value
            )}
          </p>
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
   USER SIDE: My Bookings (uses AppointmentCard with Edit + Cancel)
========================= */
function MyBookings() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, appt: null, action: "" });
  const token = getToken();
  const navigate = useNavigate();

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const { data } = await axios.get(ENDPOINTS.userBookings, { headers });
      const items = Array.isArray(data) ? data : data?.items || [];
      const filtered = items.filter((it) => !["cancelled", "canceled"].includes((it.status || "").toLowerCase()));
      setRows(filtered);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load your bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleEdit = (appt) => {
    if (!appt?._id) return;
    navigate(`/appointment/${appt._id}/edit`, { state: { appt } });
  };

  const handleCancel = (appt) => {
    if (!appt?._id) return;
    const action = "delete";
    setConfirmModal({ isOpen: true, appt, action });
  };

  const confirmCancel = async () => {
    const { appt } = confirmModal;
    setConfirmModal({ isOpen: false, appt: null, action: "" });
    
    if (!appt?._id) return;
    
    try {
      setActionLoading(true);
      await axios.delete(ENDPOINTS.remove(appt._id), { headers });
      // Remove from UI immediately for smooth experience
      setRows((prev) => prev.filter((a) => a._id !== appt._id));
      toast.success("Appointment deleted successfully!");
      // Quick refresh in background
      setTimeout(() => load(), 200);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Failed to delete appointment");
      // Reload to restore state on error
      load();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 min-h-[70vh] pb-10 relative">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">My Appointments</h1>

      {err && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
          {err}
        </div>
      )}

      {loading && <div className="text-gray-500">Loading...</div>}

      {/* Action Loading Overlay */}
      {actionLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
            <p className="text-gray-700 font-medium">Processing...</p>
          </div>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="text-gray-600 bg-white border border-gray-200 rounded-2xl p-8 text-center mb-8">
          No appointments yet.
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {rows.map((a) => (
            <AppointmentCard
              key={a._id || a.id}
              appt={a}
              role="farmer"
              onEdit={handleEdit}
              onCancel={handleCancel}
              onOpen={() => {}}
            />
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Appointment"
        message="Are you sure you want to permanently delete this appointment? This action cannot be undone."
        confirmText="OK"
        cancelText="Cancel"
        confirmColor="blue"
        onConfirm={confirmCancel}
        onCancel={() => setConfirmModal({ isOpen: false, appt: null, action: "" })}
      />
    </div>
  );
}

/* =========================
   CONSULTANT SIDE (receives appointments)
========================= */
function CApptCard({ appointment, showComplete = false, onComplete }) {
  const isUpcoming = (appointment.status || "").toLowerCase() === "confirmed";
  const dateStr = new Date(
    appointment.appointmentDate || appointment.dateISO || appointment.date || Date.now()
  ).toLocaleDateString();
  const timeStr = appointment.appointmentTime || appointment.time || "-";
  const duration = appointment.durationHours ?? appointment.duration ?? 60;
  const apptId = appointment.appointmentId
    ? `#${String(appointment.appointmentId).padStart(5, "0")}`
    : null;
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={appointment.patientAvatar} alt={appointment.name || appointment.patientName} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-gray-900 truncate max-w-[220px]">
                {appointment.name || appointment.patientName}
              </h4>
              {appointment.category && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {appointment.category}
                </span>
              )}
              {apptId && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                  {apptId}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {dateStr} • {timeStr} • {typeof duration === "number" ? `${duration} h` : duration}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-medium text-gray-900">{timeStr}</p>
          <p className="text-xs text-gray-500">{typeof duration === "number" ? `${duration} h` : duration}</p>
        </div>
      </div>

      {(appointment.email || appointment.phone || appointment.city) && (
        <div className="text-xs text-gray-500 mb-1">
          {[appointment.email, appointment.phone].filter(Boolean).join(" • ")}
          {appointment.city && (
            <span>{[appointment.email, appointment.phone].some(Boolean) ? " • " : ""}{appointment.city}</span>
          )}
        </div>
      )}

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
            {showComplete && (
              <button
                type="button"
                className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                onClick={onComplete}
              >
                Complete
              </button>
            )}
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
          {appointment.feedback && <p className="text-sm text-gray-600 italic">"{appointment.feedback}"</p>}
        </div>
      )}
    </div>
  );
}

function ConsultantDashboard({ user }) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [activeTab, setActiveTab] = useState("overview");
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]); // derived from 'pending'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [err, setErr] = useState("");

  // fetch helper so we can refresh after actions
  const fetchConsultantAppointments = async () => {
    try {
      setErr("");
      setLoading(true);
      const aRes = await axios.get(ENDPOINTS.myConsultant, { headers });
      const aItems = Array.isArray(aRes.data) ? aRes.data : aRes.data?.items || [];
      const reqs = aItems.filter((it) => (it.status || "").toLowerCase() === "pending");
      setAppointments(aItems);
      setRequests(reqs);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load consultant dashboard");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const todaysAppointments = upcomingAppointments.filter((a) => {
    const d = a.appointmentDate || a.dateISO || a.date;
    if (!d) return false;
    try {
      const iso = new Date(d).toISOString().slice(0, 10);
      return iso === todayStr;
    } catch {
      return false;
    }
  });

  const handleRequestAction = async (requestId, action) => {
    try {
      setActionLoading(true);
      if (action === "accept") {
        const res = await axios.post(ENDPOINTS.confirm(requestId), {}, { headers });
        const sent = !!res?.data?.emailSent;
        toast.success(sent ? "Appointment confirmed. Email sent to client." : "Appointment confirmed. Email not sent.");
      } else if (action === "decline") {
        const reason = window.prompt("Reason (optional):") || "";
        const res = await axios.post(ENDPOINTS.decline(requestId), { reason }, { headers });
        const sent = !!res?.data?.emailSent;
        toast.success(sent ? "Appointment declined. Email sent to client." : "Appointment declined. Email not sent.");
      }
      setTimeout(() => fetchConsultantAppointments(), 200);
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || "Failed to update request";
      setErr(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (appointmentId) => {
    try {
      setActionLoading(true);
      await axios.post(ENDPOINTS.complete(appointmentId), {}, { headers });
      toast.success("Appointment marked as completed!");
      setTimeout(() => fetchConsultantAppointments(), 200);
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || "Failed to mark as completed";
      setErr(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-green-50/95 relative">
      {/* Action Loading Overlay */}
      {actionLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
            <p className="text-gray-700 font-medium">Processing...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-transparent">
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
            {/* Icons removed as requested */}
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
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all active:scale-95 ${
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
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-700 hover:shadow-md hover:-translate-y-0.5">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Appointments</h3>
                  <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="p-6 space-y-4">
                  {todaysAppointments.map((appointment) => (
                    <CApptCard
                      key={appointment._id || appointment.id}
                      appointment={appointment}
                      showComplete
                      onComplete={() => handleComplete(appointment._id || appointment.id)}
                    />
                  ))}
                  {todaysAppointments.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No appointments scheduled for today</p>
                  )}
                </div>
              </div>

              {/* Quick Actions / Reviews */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-700 hover:shadow-md hover:-translate-y-0.5">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-6 space-y-3">
                  <button type="button" className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all active:scale-95">
                    Block Time Slot
                  </button>
                  <button type="button" className="w-full bg-gray-100 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-200 transition-all active:scale-95">
                    View Calendar
                  </button>
                  <button type="button" className="w-full bg-gray-100 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-200 transition-all active:scale-95">
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
                        {appointment.feedback && <p className="text-xs text-gray-600">"{appointment.feedback}"</p>}
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-700 hover:shadow-md hover:-translate-y-0.5">
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-700 hover:shadow-md hover:-translate-y-0.5">
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-700 hover:shadow-md hover:-translate-y-0.5">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Appointment Requests</h3>
              <p className="text-sm text-gray-600 mt-1">Review and respond to consultation requests</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.length ? (
                  requests.map((r) => (
                    <div
                      key={r._id || r.id}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col h-full min-h-[230px]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={r.patientAvatar} alt={r.name || r.patientName} />
                          <h4 className="font-semibold text-gray-900 truncate max-w-[220px]">
                            {r.name || r.patientName}
                          </h4>
                        </div>
                        <span className="shrink-0 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full border border-orange-200">
                          Pending
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 flex-wrap text-sm">
                        {r.category && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {r.category}
                          </span>
                        )}
                        {r.appointmentId && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                            #{String(r.appointmentId).padStart(5, "0")}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(r.appointmentDate).toLocaleDateString()} • {r.appointmentTime}
                        </span>
                      </div>

                      {r.notes && (
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div
                            className="text-xs italic text-gray-600 overflow-hidden whitespace-nowrap text-ellipsis"
                            title={r.notes}
                          >
                            “{r.notes}”
                          </div>
                          {/* could add a modal to view full note if needed */}
                        </div>
                      )}

                      <div className="mt-2 text-xs text-gray-500">
                        {[r.email, r.phone].filter(Boolean).join(" • ")}
                        {r.city && (
                          <span>{[r.email, r.phone].some(Boolean) ? " • " : ""}{r.city}</span>
                        )}
                      </div>

                      <div className="mt-auto flex gap-2 pt-3 border-t border-gray-100">
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
