// src/pages/dashboard/Dashboard.jsx
import React, { useState, useMemo, useEffect } from "react";
import MyAppointments from "../appointments/MyAppointments";
import API from "../../utils/api";

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

/* ------------------ Auth helper ------------------ */
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

function userIsConsultant(u) {
  if (!u) return false;
  if (u.role === "consultant") return true;
  if (Array.isArray(u.roles) && u.roles.includes("consultant")) return true;
  if (u.consultantProfile?.active) return true;
  return false;
}

/* ------------------ Small date helpers ------------------ */
function ymdLocal(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Normalize date field from an appointment record
function apptDate(appt) {
  const val = appt?.appointmentDate || appt?.appointmentDateISO || appt?.dateISO || appt?.date;
  return val ? new Date(val) : null;
}

const mockRequests = [
  {
    id: 5,
    patient: { name: "Lisa Park", avatar: "/api/placeholder/40/40" },
    requestDate: "2024-09-27",
    preferredDate: "2024-09-28",
    type: "Business Consultation",
    message: "Need help with digital transformation strategy",
  },
  {
    id: 6,
    patient: { name: "James Rodriguez", avatar: "/api/placeholder/40/40" },
    requestDate: "2024-09-26",
    preferredDate: "2024-09-29",
    type: "Follow-up Session",
    message: "Follow-up on previous marketing strategy discussion",
  },
];

/* ------------------ Small UI bits ------------------ */
// Avoid Tailwind JIT purge by mapping classes explicitly
const colorStyles = {
  blue: {
    text: "text-blue-600",
    bgIcon: "bg-blue-100",
  },
  green: {
    text: "text-green-600",
    bgIcon: "bg-green-100",
  },
  orange: {
    text: "text-orange-600",
    bgIcon: "bg-orange-100",
  },
  yellow: {
    text: "text-yellow-600",
    bgIcon: "bg-yellow-100",
  },
};

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

/* ------------------ Cards ------------------ */
const AppointmentCard = ({ appointment, onComplete }) => {
  const isConfirmed = appointment.status === "confirmed";
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Avatar src={appointment.avatar || "/api/placeholder/40/40"} alt={appointment.name} />
          <div>
            <h4 className="font-semibold text-gray-900">
              {appointment.name}
            </h4>
            {appointment.category && (
              <p className="text-sm text-gray-500">{appointment.category}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{appointment.appointmentTime || "-"}</p>
          <p className="text-xs text-gray-500">{appointment.durationHours ? `${appointment.durationHours} h` : ""}</p>
        </div>
      </div>

      {isConfirmed ? (
        <div className="flex items-center justify-between">
          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
            Confirmed
          </span>
          <div className="flex space-x-2">
            <button type="button" title="Call" className="text-blue-600 hover:text-blue-800 text-sm">
              <Phone className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
              onClick={() => onComplete?.(appointment)}
            >
              Complete
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{appointment.status}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const RequestCard = ({ request, onAction }) => (
  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-3">
        <Avatar src={request.patient.avatar} alt={request.patient.name} />
        <div>
          <h4 className="font-semibold text-gray-900">
            {request.patient.name}
          </h4>
          <p className="text-sm text-gray-500">{request.type}</p>
        </div>
      </div>
      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
        Pending
      </span>
    </div>

    <p className="text-sm text-gray-600 mb-3">"{request.message}"</p>
    <p className="text-xs text-gray-500 mb-3">
      Preferred: {request.preferredDate}
    </p>

    <div className="flex space-x-2">
      <button
        className="flex-1 bg-green-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-green-700"
        onClick={() => onAction(request.id, "accept")}
      >
        Accept
      </button>
      <button
        className="flex-1 bg-gray-200 text-gray-800 text-sm py-2 px-3 rounded-lg hover:bg-gray-300"
        onClick={() => onAction(request.id, "decline")}
      >
        Decline
      </button>
    </div>
  </div>
);

/* ------------------ Consultant Dashboard ------------------ */
const ConsultantDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Today as local yyyy-mm-dd string
  const todayStr = ymdLocal(new Date());

  // load consultant appointments (confirmed + others for stats)
  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await API.get(`/appointments/my-consultant`);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const upcoming = appointments.filter((a) => a.status === "confirmed").length;
    const ratings = appointments.filter((a) => typeof a.rating === "number");
    const avg =
      ratings.reduce((acc, a) => acc + (a.rating || 0), 0) /
        (ratings.length || 1) || 0;
    return { total, completed, upcoming, avgRating: avg.toFixed(1) };
  }, [appointments]);

  const upcomingAppointments = appointments
    .filter((a) => String(a.status || "").toLowerCase() === "confirmed")
    .sort((a, b) => String(a.appointmentDate).localeCompare(String(b.appointmentDate)));

  const completedAppointments = appointments
    .filter((a) => String(a.status || "").toLowerCase() === "completed")
    .sort((a, b) => String(b.appointmentDate).localeCompare(String(a.appointmentDate)));

  // Show today for both pending and confirmed
  const todaysAppointments = appointments
    .filter((a) => {
      const s = String(a.status || "").toLowerCase();
      return s === "pending" || s === "confirmed";
    })
    .filter((a) => {
      const d = apptDate(a);
      if (!d) return false;
      return d.toDateString() === new Date().toDateString();
    })
    .sort((a, b) => String(a.appointmentDate).localeCompare(String(b.appointmentDate)));

  // Debug (remove if noisy)
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[Dashboard] loaded:", {
      total: appointments.length,
      today: todaysAppointments.length,
      todayStatuses: todaysAppointments.map((x) => x.status),
    });
  }

  // actions
  async function completeAppt(appt) {
    if (!window.confirm("Mark this appointment as completed?")) return;
    try {
      await API.post(`/appointments/${appt._id}/complete`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to mark completed");
    }
  }

  const handleRequestAction = (requestId, action) => {
    console.log(`${action} request ${requestId}`);
    // TODO: call your API: POST /requests/:id/accept or decline
  };

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
                <p className="text-sm text-gray-600">
                  Business Strategy Consultant
                </p>
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
                activeTab === tab.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
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
              <StatCard
                title="Total Appointments"
                value={`${stats.total}+`}
                subtitle="All Time"
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Completed"
                value={stats.completed}
                subtitle="Overall"
                icon={CheckCircle}
                color="green"
              />
              <StatCard
                title="Upcoming"
                value={stats.upcoming}
                subtitle="Scheduled"
                icon={Clock}
                color="orange"
              />
              <StatCard
                title="Average Rating"
                value={stats.avgRating}
                subtitle="From Reviews"
                icon={Star}
                color="yellow"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Appointments */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Today&apos;s Appointments
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  {loading && (
                    <p className="text-gray-500 text-center py-8">Loading…</p>
                  )}
                  {!loading && todaysAppointments.slice(0, 6).map((appointment) => (
                    <AppointmentCard
                      key={appointment._id}
                      appointment={appointment}
                      onComplete={completeAppt}
                    />
                  ))}
                  {!loading && todaysAppointments.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      No appointments scheduled for today
                    </p>
                  )}
                  {error && (
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  )}
                </div>
              </div>

              {/* Quick Actions + Recent Reviews */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Quick Actions
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <button
                    type="button"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Block Time Slot
                  </button>
                  <button
                    type="button"
                    className="w-full bg-gray-100 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    View Calendar
                  </button>
                  <button
                    type="button"
                    className="w-full bg-gray-100 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Update Availability
                  </button>
                </div>

                <div className="px-6 pb-6">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Recent Reviews
                  </h4>
                  <div className="space-y-3">
                    {completedAppointments.slice(0, 2).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border-l-4 border-green-400 pl-3"
                      >
                        <div className="flex items-center space-x-1 mb-1">
                          <Stars value={appointment.rating} />
                        </div>
                        {appointment.feedback && (
                          <p className="text-xs text-gray-600">
                            "{appointment.feedback}"
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          - {appointment.patient.name}
                        </p>
                      </div>
                    ))}
                    {completedAppointments.length === 0 && (
                      <p className="text-xs text-gray-500">
                        No reviews yet.
                      </p>
                    )}
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
                <h3 className="text-lg font-semibold text-gray-900">
                  Upcoming Appointments
                </h3>
              </div>
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {upcomingAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                  />
                ))}
                {upcomingAppointments.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No upcoming appointments
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Completed
                </h3>
              </div>
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {completedAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                  />
                ))}
                {completedAppointments.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No completed appointments yet
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Requests */}
        {activeTab === "requests" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Appointment Requests
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Review and respond to consultation requests
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onAction={handleRequestAction}
                  />
                ))}
              </div>
              {mockRequests.length === 0 && (
                <p className="text-gray-500 text-center py-12">
                  No pending requests
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------ Public Dashboard Wrapper ------------------ */
export default function Dashboard() {
  const user = readAuthUser();
  const isConsultant = userIsConsultant(user);
  const [tab, setTab] = useState(isConsultant ? "consultant" : "bookings");

  if (isConsultant && tab === "consultant") {
    return <ConsultantDashboard user={user} />;
  }
  

  // Non-consultant version (keep simple placeholder)
  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex gap-2 border-b mb-4">
        <button
          className={`px-3 py-2 ${
            tab === "bookings" ? "border-b-2 border-green-600 font-semibold" : ""
          }`}
          onClick={() => setTab("bookings")}
          type="button"
        >
          My Bookings
        </button>

        {isConsultant && (
          <button
            className={`px-3 py-2 ${
              tab === "consultant"
                ? "border-b-2 border-green-600 font-semibold"
                : ""
            }`}
            onClick={() => setTab("consultant")}
            type="button"
          >
            Consultant Dashboard
          </button>
        )}
      </div>

      {tab === "bookings" && (
        <div className="bg-white border rounded-xl p-6 text-gray-700">
          MyBookings Component Here
        </div>
      )}
    </div>
  );
  
}
