import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AdminLoader from "../components/AdminLoader";
import { 
  FaUserMd, 
  FaCalendarCheck, 
  FaHourglassHalf, 
  FaCheckCircle, 
  FaTimesCircle,
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaUser,
  FaFileExport
} from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// Helper: get stored token
const getStoredToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token") ||
  localStorage.getItem("auth_token") ||
  sessionStorage.getItem("auth_token");

const authHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper: pick a photo URL from various common fields
const pickPhotoField = (c) => {
  return (
    c?.photo ||
    c?.image ||
    c?.avatar ||
    c?.avatarUrl ||
    c?.profileImage ||
    c?.profilePic ||
    c?.picture ||
    c?.profile?.photo ||
    c?.profile?.image ||
    ""
  );
};

// Helper: make relative URLs absolute with BASE_URL, keep absolute URLs as-is
const resolveImageUrl = (urlLike) => {
  if (!urlLike || typeof urlLike !== "string") return "";
  const trimmed = urlLike.trim();
  if (/^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed)) return trimmed;
  const left = String(BASE_URL || "").replace(/\/+$/, "");
  const right = trimmed.replace(/^\/+/, "");
  return `${left}/${right}`;
};

// Avatar component with error fallback to initial
const ConsultantAvatar = ({ name, photo }) => {
  const imgRef = useRef(null);
  const [broken, setBroken] = useState(false);
  const initial =
    (name && String(name).trim().charAt(0).toUpperCase()) || "C";
  const src = photo ? resolveImageUrl(photo) : "";

  useEffect(() => {
    // reset broken state if photo prop changes
    setBroken(false);
  }, [photo]);

  if (!src || broken) {
    return (
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
        {initial}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={name ? `${name}'s profile` : "Consultant profile"}
      className="w-16 h-16 rounded-full object-cover shadow-lg border border-white"
      onError={() => setBroken(true)}
      loading="lazy"
    />
  );
};

export default function ConsultantAdmin() {
  const [consultants, setConsultants] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedConsultants, setExpandedConsultants] = useState(new Set());
  const [sortBy, setSortBy] = useState("appointments"); // appointments, name, specialization

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const [consultantsRes, appointmentsRes] = await Promise.all([
        axios.get(`${BASE_URL}/consultants`, {
          headers: authHeaders(),
          params: { limit: 1000 }
        }),
        axios.get(`${BASE_URL}/api/appointments`, {
          headers: authHeaders(),
        }),
      ]);

      const consultantsList = consultantsRes.data?.items || consultantsRes.data || [];
      const appointmentsList = Array.isArray(appointmentsRes.data) 
        ? appointmentsRes.data 
        : appointmentsRes.data?.appointments || [];

      setConsultants(consultantsList);
      setAppointments(appointmentsList);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalConsultants = consultants.length;
    const totalAppointments = appointments.length;
    const pendingAppointments = appointments.filter(a => a.status === "pending").length;
    const confirmedAppointments = appointments.filter(a => a.status === "confirmed").length;
    const completedAppointments = appointments.filter(a => a.status === "completed").length;
    const cancelledAppointments = appointments.filter(a => a.status === "cancelled").length;
    const activeConsultants = new Set(
      appointments.map(a => String(a.consultantId ?? a.consultant?._id ?? a.consultant))
    ).size;

    return {
      totalConsultants,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      activeConsultants,
    };
  }, [consultants, appointments]);

  // Group appointments by consultant
  const consultantsWithAppointments = useMemo(() => {
    const consultantMap = new Map();

    // Initialize with all consultants (support id or _id)
    consultants.forEach(consultant => {
      const cid = String(consultant.id ?? consultant._id ?? "");
      if (!cid) return;
      consultantMap.set(cid, {
        ...consultant,
        id: cid,
        appointments: [],
      });
    });

    // Add appointments to consultants
    appointments.forEach(appointment => {
      const consultantId = String(
        appointment.consultantId ?? appointment.consultant?._id ?? appointment.consultant ?? ""
      );
      if (!consultantId) return;

      if (consultantMap.has(consultantId)) {
        consultantMap.get(consultantId).appointments.push(appointment);
      } else {
        // Consultant not in list, create a minimal entry
        consultantMap.set(consultantId, {
          id: consultantId,
          name: appointment.consultantName || "Unknown Consultant",
          category: "N/A",
          city: "N/A",
          appointments: [appointment],
        });
      }
    });

    return Array.from(consultantMap.values());
  }, [consultants, appointments]);

  // Filter and sort consultants
  const filteredConsultants = useMemo(() => {
    let filtered = consultantsWithAppointments;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(search) ||
        c.category?.toLowerCase().includes(search) ||
        c.city?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(c => 
        c.appointments.some(a => a.status === statusFilter)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "appointments":
          return b.appointments.length - a.appointments.length;
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "specialization":
          return (a.category || "").localeCompare(b.category || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [consultantsWithAppointments, searchTerm, statusFilter, sortBy]);

  const toggleConsultant = (consultantId) => {
    setExpandedConsultants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(consultantId)) {
        newSet.delete(consultantId);
      } else {
        newSet.add(consultantId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: FaHourglassHalf },
      confirmed: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: FaCalendarCheck },
      completed: { color: "bg-green-100 text-green-800 border-green-300", icon: FaCheckCircle },
      cancelled: { color: "bg-red-100 text-red-800 border-red-300", icon: FaTimesCircle },
      declined: { color: "bg-gray-100 text-gray-800 border-gray-300", icon: FaTimesCircle },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
        <Icon className="text-xs" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const exportToPDF = async () => {
    try {
      toast.success("Redirecting to report page...");
      window.location.href = "/admin/consultantReport";
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  if (isLoading) {
    return <AdminLoader message="Loading consultant data..." />;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <FaUserMd className="text-blue-600" />
                Consultant Management
              </h1>
              <p className="text-gray-600 mt-2">Manage consultants and their appointments</p>
            </div>
            <div className="flex items-center gap-4">
              {isRefreshing && (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                  <span>Updating...</span>
                </div>
              )}
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FaFileExport />
                Export Report
              </button>
              <button
                onClick={() => fetchData(true)}
                disabled={isRefreshing || isLoading}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              >
                <div className="flex items-center gap-2">
                  {isRefreshing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Consultants</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalConsultants}</p>
                <p className="text-sm text-gray-500 mt-1">{stats.activeConsultants} active</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <FaUserMd className="text-3xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Appointments</p>
                <p className="text-4xl font-bold text-purple-600 mt-2">{stats.totalAppointments}</p>
                <p className="text-sm text-gray-500 mt-1">All time</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-full">
                <FaCalendarCheck className="text-3xl text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{stats.completedAppointments}</p>
                <p className="text-sm text-gray-500 mt-1">{stats.confirmedAppointments} confirmed</p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <FaCheckCircle className="text-3xl text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row (includes Cancelled) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-medium">Pending Requests</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pendingAppointments}</p>
              </div>
              <FaHourglassHalf className="text-4xl text-orange-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-medium">Confirmed Appointments</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.confirmedAppointments}</p>
              </div>
              <FaCalendarCheck className="text-4xl text-indigo-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl shadow-lg p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-medium">Cancelled Appointments</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.cancelledAppointments}</p>
              </div>
              <FaTimesCircle className="text-4xl text-red-400" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search consultants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
            >
              <option value="appointments">Sort by: Appointments</option>
              <option value="name">Sort by: Name</option>
              <option value="specialization">Sort by: Specialization</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredConsultants.length}</span> consultant(s)
        </div>

        {/* Consultants List */}
        <div className="space-y-6">
          {filteredConsultants.map((consultant) => {
            const cid = String(consultant.id ?? consultant._id ?? "");
            const isExpanded = expandedConsultants.has(cid);
            const appointmentCount = consultant.appointments.length;
            const photo = pickPhotoField(consultant);

            return (
              <div
                key={cid}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Consultant Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleConsultant(cid)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* ✅ Avatar with image when available */}
                      <ConsultantAvatar name={consultant.name} photo={photo} />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{consultant.name || "Unknown"}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <FaUserMd className="text-blue-600" />
                            {consultant.category || "N/A"}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaMapMarkerAlt className="text-red-500" />
                            {consultant.city || "N/A"}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-purple-600">
                            <FaCalendarCheck />
                            {appointmentCount} appointment(s)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {appointmentCount > 0 && (
                        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-bold text-lg">
                          {appointmentCount}
                        </div>
                      )}
                      {isExpanded ? (
                        <FaChevronUp className="text-2xl text-gray-400" />
                      ) : (
                        <FaChevronDown className="text-2xl text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Appointments List (Expanded) */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {consultant.appointments.length > 0 ? (
                      <div className="p-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FaCalendarCheck className="text-blue-600" />
                          Appointments ({consultant.appointments.length})
                        </h4>
                        <div className="grid gap-4">
                          {consultant.appointments.map((appointment, idx) => (
                            <div
                              key={appointment._id || appointment.appointmentId || idx}
                              className="bg-white rounded-xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {appointment.appointmentId || "#"}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900">ID: {appointment.appointmentId || "N/A"}</p>
                                    <p className="text-sm text-gray-600">{appointment.category || "General"}</p>
                                  </div>
                                </div>
                                {getStatusBadge(appointment.status)}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                  <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                                    <FaUser className="text-gray-400" />
                                    <span className="font-semibold">Client:</span> {appointment.name || "N/A"}
                                  </p>
                                  <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                                    <FaPhone className="text-green-500" />
                                    <span className="font-semibold">Phone:</span> {appointment.phone || "N/A"}
                                  </p>
                                  <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                                    <FaEnvelope className="text-blue-500" />
                                    <span className="font-semibold">Email:</span> {appointment.email || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-red-500" />
                                    <span className="font-semibold">Location:</span> {appointment.city || "N/A"}, {appointment.state || "N/A"}
                                  </p>
                                  <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                                    <FaCalendarCheck className="text-purple-500" />
                                    <span className="font-semibold">Date:</span> 
                                    {appointment.appointmentDate 
                                      ? new Date(appointment.appointmentDate).toLocaleDateString()
                                      : "N/A"}
                                  </p>
                                  <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                                    <FaClock className="text-orange-500" />
                                    <span className="font-semibold">Time:</span> {appointment.appointmentTime || "N/A"} 
                                    ({appointment.durationHours || 1}h)
                                  </p>
                                </div>
                              </div>

                              {appointment.notes && (
                                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                                  <p className="text-sm text-gray-700">
                                    <span className="font-semibold">Notes:</span> {appointment.notes}
                                  </p>
                                </div>
                              )}

                              {appointment.declineReason && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <p className="text-sm text-red-700">
                                    <span className="font-semibold">Decline Reason:</span> {appointment.declineReason}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <FaCalendarCheck className="text-5xl mx-auto mb-3 text-gray-300" />
                        <p>No appointments yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredConsultants.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <FaUserMd className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-600">No consultants found</p>
              <p className="text-gray-500 mt-2">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
