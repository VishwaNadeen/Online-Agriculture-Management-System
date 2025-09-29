import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  FileText,
  Filter,
  Download,
  Search,
  CheckCircle,
  User,
  Wheat,
  MapPin,
  Clock,
  Sprout,
} from "lucide-react";
import { ApptAPI } from "../api/appointments";
import api from "../utils/api";
import { ConsultantAPI } from "../api/consultants";

export default function AgriAnalytics() {
  const [activeTab, setActiveTab] = useState("Today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // live data
  const [myAppointments, setMyAppointments] = useState([]); // assigned to me as consultant
  const [topConsultants, setTopConsultants] = useState([]);
  const [me, setMe] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [appts, consultantsRes, meRes] = await Promise.all([
          ApptAPI.listAsConsultant(),
          api.get("/consultants", { params: { limit: 5 } }).then((r) => r.data?.items || []),
          ConsultantAPI.getMe().catch(() => null),
        ]);
        if (!mounted) return;
        setMyAppointments(appts || []);
        setTopConsultants(consultantsRes || []);
        setMe(meRes);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // helper functions: compute stats from appointments (no payments required)
  const pickUnique = (arr, key) => {
    const set = new Set();
    for (const a of arr) if (a && a[key]) set.add(String(a[key]));
    return set.size;
  };

  const dashboardData = useMemo(() => {
    const total = myAppointments.length;
    const confirmed = myAppointments.filter((a) => a.status === "confirmed").length;
    const completed = myAppointments.filter((a) => a.status === "completed").length;
    const activeFarms = pickUnique(myAppointments, "userId");

    return {
      totalRequests: total,
      confirmedRequests: confirmed,
      activeFarms,
      projectCompletion: total ? Math.round((completed / total) * 100) : 0,
      // change deltas kept zero until we add time-window comparisons
      requestsChange: 0,
      confirmedChange: 0,
      farmsChange: 0,
      completionChange: 0,
    };
  }, [myAppointments]);

  // group categories for right-side donut
  const clientsByIndustry = useMemo(() => {
    const by = new Map();
    myAppointments.forEach((a) => {
      const k = a.category || "Other";
      by.set(k, (by.get(k) || 0) + 1);
    });
    // map to color palette
    const colors = [
      "bg-green-500",
      "bg-yellow-500",
      "bg-blue-500",
      "bg-purple-500",
      "bg-orange-500",
    ];
    return Array.from(by.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [myAppointments]);

  // simple weekly bar: count appointments by weekday
  const revenueData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = new Array(7).fill(0);
    for (const a of myAppointments) {
      const d = new Date(a.appointmentDate);
      if (!isNaN(d)) counts[d.getDay()] += 1;
    }
    // scale to a pseudo monetary value to fit existing UI (multiply by constant)
    return days.map((day, idx) => ({ day, value: counts[idx] * 8000 }));
  }, [myAppointments]);

  // ✅ FIXED: include `icon: Icon`
  const StatCard = ({ title, value, change, icon: Icon, suffix = "" }) => {
    const isPositive = change > 0;
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-lg bg-green-50">
            <Icon className="w-6 h-6 text-green-600" />
          </div>
          <span className={`text-sm font-medium px-2 py-1 rounded ${isPositive ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
            {isPositive ? "+" : ""}{change}%
          </span>
        </div>
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {typeof value === "number" ? value.toLocaleString() : value}{suffix}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-full">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Sprout className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">AGRI ANALYTICS</h1>
          </div>
          <p className="text-gray-600">Insights for agriculture operations</p>
          {me && (
            <div className="mt-1 text-sm text-gray-700">
              Welcome, <span className="font-semibold">{me.name}</span> • {me.city} • {me.specialization}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select className="border-none bg-transparent text-sm font-medium focus:outline-none">
              <option>Select Date</option>
              <option>Today</option>
              <option>Yesterday</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <button className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
        {["Today", "Yesterday", "Weekly", "Monthly"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab ? "bg-white text-green-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stats (appointment based, no payments) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Requests" value={dashboardData.totalRequests} change={dashboardData.requestsChange} icon={Users} />
        <StatCard title="Confirmed Requests" value={dashboardData.confirmedRequests} change={dashboardData.confirmedChange} icon={TrendingUp} />
        <StatCard title="Active Farms" value={dashboardData.activeFarms} change={dashboardData.farmsChange} icon={Wheat} />
        <StatCard title="Project Completion" value={`${dashboardData.projectCompletion}/100`} change={dashboardData.completionChange} icon={CheckCircle} />
      </div>

      {/* Revenue & Industries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
            <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
          <div className="h-64 flex items-end space-x-4">
            {revenueData.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-green-500 rounded-t-md mb-2 transition-all duration-300 hover:bg-green-600"
                  style={{ height: `${Math.min(1, item.value / 30000) * 200}px` }}
                />
                <span className="text-xs text-gray-600">{item.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">Average Weekly: </span>
            <span className="font-semibold text-green-600">$20,834</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Client by Industry</h3>
          <div className="relative mb-6">
            <div className="w-32 h-32 mx-auto relative">
              <div className="w-full h-full rounded-full border-8 border-green-500" />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-gray-900">8,510</span>
                <span className="text-xs text-gray-600">Total Farms</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {clientsByIndustry.map((ind, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${ind.color}`} />
                <span className="text-sm text-gray-600 flex-1">{ind.name}</span>
                <span className="text-sm font-semibold text-gray-900">{ind.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects & Consultants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="text-sm border-none bg-gray-50 rounded-lg px-3 py-1 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="space-y-4">
            {(myAppointments || []).slice(0, 6).map((p) => (
              <div key={p._id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{p.name} • {p.category}</h4>
                  <span className="text-xs text-gray-500 capitalize">{p.status}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{p.city || "-"}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div className={`h-2 rounded-full transition-all duration-300 ${p.status === "confirmed" ? "bg-green-500" : p.status === "pending" ? "bg-yellow-500" : "bg-gray-400"}`} style={{ width: `${p.status === "confirmed" ? 80 : p.status === "pending" ? 40 : 20}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Date: {new Date(p.appointmentDate).toLocaleDateString()}</span>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{p.email}</span>
                  </div>
                </div>
              </div>
            ))}
            {!loading && (myAppointments || []).length === 0 && (
              <p className="text-sm text-gray-500">No appointments yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Consultants</h3>
            <a href="/consultants" className="text-sm text-green-600 hover:text-green-700">See All</a>
          </div>
          <div className="space-y-4">
            {topConsultants.map((c) => (
              <div key={c.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">🌿</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{c.name}</h4>
                  <p className="text-sm text-gray-600">{c.city}</p>
                  <p className="text-xs text-green-600">{c.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{(c.yearsExp || 0)} yrs</p>
                  <p className="text-xs text-gray-600">{(c.languages || []).join(", ")}</p>
                </div>
              </div>
            ))}
            {!loading && topConsultants.length === 0 && (
              <p className="text-sm text-gray-500">No consultants found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Appointments */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Appointments</h3>
          <a href="/appointments" className="text-sm text-green-600 hover:text-green-700">See All</a>
        </div>
        <div className="space-y-4">
          {(myAppointments || [])
            .filter((a) => {
              const d = new Date(a.appointmentDate);
              const now = new Date();
              return (
                d.getFullYear() === now.getFullYear() &&
                d.getMonth() === now.getMonth() &&
                d.getDate() === now.getDate()
              );
            })
            .map((a) => (
              <div key={a._id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
                <div className="p-3 rounded-lg bg-green-50">
                  {a.category?.toLowerCase().includes("field") && <MapPin className="w-5 h-5 text-green-600" />}
                  {a.category?.toLowerCase().includes("soil") && <FileText className="w-5 h-5 text-green-600" />}
                  {!a.category && <Users className="w-5 h-5 text-green-600" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{a.name}</h4>
                  <p className="text-sm text-gray-600">{a.city || "-"}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span>{a.appointmentTime}</span>
                  </div>
                  <p className="text-xs text-green-600 capitalize">{a.status}</p>
                </div>
              </div>
            ))}
          {!loading && (myAppointments || []).every((a) => {
            const d = new Date(a.appointmentDate);
            const now = new Date();
            return !(
              d.getFullYear() === now.getFullYear() &&
              d.getMonth() === now.getMonth() &&
              d.getDate() === now.getDate()
            );
          }) && (myAppointments || []).length === 0 && (
            <p className="text-sm text-gray-500">No appointments today.</p>
          )}
        </div>
      </div>
    </div>
  );
}
