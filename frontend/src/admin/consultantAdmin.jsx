import React, { useState } from "react";
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

export default function AgriAnalytics() {
  const [activeTab, setActiveTab] = useState("Today");

  const dashboardData = {
    totalRevenue: 124850,
    totalExpenses: 35200,
    activeFarms: 3847,
    projectCompletion: 92,
    revenueGrowth: 15.8,
    expenseChange: -8.2,
    farmsGrowth: 12.4,
    completionChange: 8.3,
  };

  const consultants = [
    { id: 1, name: "Dr. Sarah Johnson", email: "sarah.johnson@agritech.com", specialty: "Crop Management", avatar: "🌾", activeFarms: 45, satisfaction: 4.9 },
    { id: 2, name: "Michael Chen", email: "michael.chen@agritech.com", specialty: "Soil Analysis", avatar: "🌱", activeFarms: 38, satisfaction: 4.8 },
    { id: 3, name: "Emma Rodriguez", email: "emma.rodriguez@agritech.com", specialty: "Irrigation Systems", avatar: "💧", activeFarms: 52, satisfaction: 4.9 },
  ];

  const projects = [
    { id: 1, name: "Sustainable Farming Initiative", client: "GreenVale Farms", completion: 85, deadline: "Mar 15, 2025", consultant: "Dr. Sarah Johnson" },
    { id: 2, name: "Soil Health Assessment", client: "Prairie Gold Agricultural", completion: 62, deadline: "Apr 8, 2025", consultant: "Michael Chen" },
    { id: 3, name: "Smart Irrigation Setup", client: "Sunrise Orchards", completion: 90, deadline: "Feb 28, 2025", consultant: "Emma Rodriguez" },
    { id: 4, name: "Organic Certification Process", client: "EcoHarvest Co.", completion: 45, deadline: "May 12, 2025", consultant: "Dr. Sarah Johnson" },
  ];

  const appointments = [
    { id: 1, title: "Farm Site Visit - Crop Assessment", time: "09:00 AM - 10:30 AM", client: "Meadowbrook Farm", consultant: "Dr. Sarah Johnson", type: "site-visit" },
    { id: 2, title: "Irrigation System Planning", time: "02:00 PM - 03:30 PM", client: "Valley View Agriculture", consultant: "Emma Rodriguez", type: "consultation" },
    { id: 3, title: "Soil Sample Analysis Review", time: "04:00 PM - 05:00 PM", client: "Golden Fields Ltd.", consultant: "Michael Chen", type: "review" },
  ];

  const clientsByIndustry = [
    { name: "Grain Farming", value: 2847, color: "bg-green-500" },
    { name: "Livestock", value: 1956, color: "bg-yellow-500" },
    { name: "Horticulture", value: 1432, color: "bg-blue-500" },
    { name: "Dairy Farming", value: 1288, color: "bg-purple-500" },
    { name: "Organic Farms", value: 987, color: "bg-orange-500" },
  ];

  const revenueData = [
    { day: "Mon", value: 18500 },
    { day: "Tue", value: 22300 },
    { day: "Wed", value: 19800 },
    { day: "Thu", value: 25600 },
    { day: "Fri", value: 21400 },
    { day: "Sat", value: 16900 },
    { day: "Sun", value: 20350 },
  ];

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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Sprout className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">AGRI ANALYTICS</h1>
          </div>
          <p className="text-gray-600">Insights for agriculture operations</p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Revenue" value={dashboardData.totalRevenue} change={dashboardData.revenueGrowth} icon={DollarSign} suffix="$" />
        <StatCard title="Total Expenses" value={dashboardData.totalExpenses} change={dashboardData.expenseChange} icon={TrendingUp} suffix="$" />
        <StatCard title="Active Farms" value={dashboardData.activeFarms} change={dashboardData.farmsGrowth} icon={Wheat} />
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
                  style={{ height: `${(item.value / 30000) * 200}px` }}
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
            <h3 className="text-lg font-semibold text-gray-900">Project Status</h3>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                className="text-sm border-none bg-gray-50 rounded-lg px-3 py-1 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="space-y-4">
            {projects.map((p) => (
              <div key={p.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{p.name}</h4>
                  <span className="text-xs text-gray-500">{p.completion}%</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{p.client}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${p.completion}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Due: {p.deadline}</span>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{p.consultant}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Consultants</h3>
            <a href="/consultants" className="text-sm text-green-600 hover:text-green-700">See All</a>
          </div>
          <div className="space-y-4">
            {consultants.map((c) => (
              <div key={c.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">{c.avatar}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{c.name}</h4>
                  <p className="text-sm text-gray-600">{c.email}</p>
                  <p className="text-xs text-green-600">{c.specialty}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{c.activeFarms} farms</p>
                  <p className="text-xs text-gray-600">★ {c.satisfaction}</p>
                </div>
              </div>
            ))}
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
          {appointments.map((a) => (
            <div key={a.id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
              <div className="p-3 rounded-lg bg-green-50">
                {a.type === "site-visit" && <MapPin className="w-5 h-5 text-green-600" />}
                {a.type === "consultation" && <Users className="w-5 h-5 text-green-600" />}
                {a.type === "review" && <FileText className="w-5 h-5 text-green-600" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{a.title}</h4>
                <p className="text-sm text-gray-600">{a.client}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>{a.time}</span>
                </div>
                <p className="text-xs text-green-600">{a.consultant}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
