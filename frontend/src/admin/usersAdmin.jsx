// src/admin/usersAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FiSearch, FiTrash2, FiDownload } from "react-icons/fi";
import AdminLoader from "../components/AdminLoader";
import {
  ensurePdfStackReady,
  createGreenGrowLetterShell,
} from "../utils/pdf/greenGrowLetterShell";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const SITE_NAME = import.meta.env.VITE_SITE_NAME || "Green Grow";

/* read token (for DELETE auth) */
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

/* normalize API response shape */
function pickUsersFrom(res) {
  if (!res) return [];
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.users)) return res.data.users;
  if (Array.isArray(res.data?.data?.users)) return res.data.data.users;
  return [];
}

/* UI helpers */
const Th = ({ children, className = "" }) => (
  <th className={`px-4 py-3 font-medium text-xs uppercase tracking-wide text-gray-600 ${className}`}>
    {children}
  </th>
);
const Td = ({ children, className = "" }) => (
  <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>
);

function RoleBadge({ role }) {
  const r = (role || "").toLowerCase();
  const map = {
    farmer: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    consultant: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    admin: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  };
  return (
    <span className={`text-[11px] px-2 py-1 rounded-full ${map[r] || "bg-gray-50 text-gray-700 ring-1 ring-gray-200"}`}>
      {r || "-"}
    </span>
  );
}
function StatusBadge({ status }) {
  const s = (status || "").toUpperCase();
  const map = {
    ACTIVE: "bg-green-50 text-green-700 ring-1 ring-green-200",
    PENDING: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
    INACTIVE: "bg-red-50 text-red-700 ring-red-200",
  };
  return (
    <span className={`text-[11px] px-2 py-1 rounded-full ${map[s] || "bg-gray-50 text-gray-700 ring-1 ring-gray-200"}`}>
      {s || "-"}
    </span>
  );
}
function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

/* --------- stats (for summary only) --------- */
function buildStats(users) {
  const total = users.length;

  const roleCounts = users.reduce((acc, u) => {
    const r = (u.role || "user").toLowerCase();
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});
  const roleLabels = ["user", "farmer", "consultant", "admin"];
  const roleData = roleLabels.map((k) => roleCounts[k] || 0);

  const statusCounts = users.reduce((acc, u) => {
    const s = (u.status || "ACTIVE").toUpperCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const statusLabels = ["ACTIVE", "PENDING", "INACTIVE"];
  const statusData = statusLabels.map((k) => statusCounts[k] || 0);

  return {
    total,
    role: { labels: roleLabels.map((s) => s.toUpperCase()), data: roleData },
    status: { labels: statusLabels, data: statusData },
  };
}

export default function UsersAdmin() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("ALL");
  const [downloading, setDownloading] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);

  const loadUsers = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.get(`${BASE}/api/users`);
      const rows = pickUsersFrom(res);
      setUsers(rows);
    } catch (err) {
      console.error("GET /api/users failed:", err?.response?.status, err?.response?.data || err?.message);
      setUsers([]);
      setError("Could not load users from /api/users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    (async () => {
      try {
        await ensurePdfStackReady();
        setPdfReady(true);
      } catch (e) {
        console.error("Failed to preload PDF deps:", e);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let rows = [...users];
    if (q.trim()) {
      const s = q.toLowerCase();
      rows = rows.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(s) ||
          (u.email || "").toLowerCase().includes(s) ||
          (u.phone || "").toLowerCase().includes(s)
      );
    }
    if (role !== "ALL") {
      rows = rows.filter((u) => (u.role || "").toUpperCase() === role);
    }
    return rows;
  }, [users, q, role]);

  const deleteUser = async (id) => {
    const ok = confirm("Delete this user? This cannot be undone.");
    if (!ok) return;
    try {
      const token = readAuthToken();
      await axios.delete(`${BASE}/api/users/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      console.error("DELETE /api/users/:id failed:", err?.response?.status, err?.response?.data || err?.message);
      alert(err?.response?.data?.message || "Failed to delete user");
    }
  };

  const count = filtered.length;

  const downloadUsersReport = async () => {
    try {
      if (loading) { alert("Please wait until data loads."); return; }
      if (!Array.isArray(users) || users.length === 0) { alert("No users to export."); return; }
      if (!pdfReady) { await ensurePdfStackReady(); setPdfReady(true); }
      setDownloading(true);

      // Stats for summary
      const stats = buildStats(users);
      const nowStr = new Date().toLocaleString(undefined, {
        year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
      });

      // Shell (header + footer)
      const { doc, margins, contentWidth, addPage, save } =
        await createGreenGrowLetterShell({
          brandName: SITE_NAME,
          brandAccent: [4, 120, 87],
          brandPrimary: [17, 24, 39],
          addressLines: ["123 Harvest Lane, Agricultural District, Colombo 05, Sri Lanka"],
          contactLine: "Contact: +94 11 234 5678",
          emailLine: "Email: support@greengrow.lk",
          rightTitle: "Users Report",
          rightSubTitle: `Generated on ${nowStr}`,
          footerNoteLeft: "This is a computer-generated report.",
          footerNoteRight: "greengrow.lk | +94 11 234 5678",
        });

      // ===== Body =====
      let y = Math.max(margins.top, 36);
      const x = margins.left;
      const pageH = doc.internal.pageSize.getHeight();

      // Section title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text(`${SITE_NAME} — Users Summary`, x, y); y += 6;

      // Divider
      doc.setDrawColor(4, 120, 87);
      doc.setLineWidth(0.6);
      doc.line(x, y, x + contentWidth, y); y += 7;

      // Summary (Totals only)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const farmers = stats.role.data[1] || 0;
      const consultants = stats.role.data[2] || 0;
      doc.text(`Total Users: ${stats.total}`, x, y); y += 5;
      doc.text(`Farmers: ${farmers}    Consultants: ${consultants}`, x, y); y += 9;

      // Users table
      if (y > (pageH - margins.bottom - 20)) { addPage(); y = Math.max(margins.top, 36); }
      const head = [["#", "Name", "Email", "Phone", "Role", "Status", "Joined"]];
      const body = users.map((u, i) => [
        String(i + 1),
        `${u.firstName || ""} ${u.lastName || ""}`.trim(),
        u.email || "",
        u.phone || "",
        (u.role || "").toUpperCase(),
        (u.status || "ACTIVE").toUpperCase(),
        formatDate(u.createdAt),
      ]);

      doc.setFontSize(10);
      doc.autoTable({
        startY: y,
        head,
        body,
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [236, 253, 245], textColor: [4, 120, 87], lineWidth: 0.2, lineColor: [209, 213, 219] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 40 },
          2: { cellWidth: 46 },
          3: { cellWidth: 30 },
          4: { cellWidth: 20 },
          5: { cellWidth: 24 },
          6: { cellWidth: 24 },
        },
        theme: "striped",
        margin: { left: margins.left, right: margins.right },
      });

      save(`${SITE_NAME.replace(/\s+/g, "_")}_Users_Report.pdf`);
    } catch (err) {
      console.error(err);
      alert("Users PDF download failed.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <AdminLoader message="Loading users data..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-6 sm:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 bg-clip-text text-transparent mb-3">
                Users Management
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                Manage and organize all your users, farmers, and consultants.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300/50 shadow-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2" />
                <span className="text-sm font-semibold">
                  {count} {count === 1 ? "user" : "users"}
                </span>
              </div>
              <button
                onClick={downloadUsersReport}
                disabled={downloading || loading || users.length === 0 || !pdfReady}
                className="group relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                title="Download Users Report (PDF)"
              >
                <div className="flex items-center gap-2">
                  {downloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Preparing…</span>
                    </>
                  ) : !pdfReady ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Preparing deps…</span>
                    </>
                  ) : (
                    <>
                      <FiDownload className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                      <span>Download Report</span>
                    </>
                  )}
                </div>
              </button>
              <button
                onClick={loadUsers}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
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

        {/* Filters */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, email, or phone…"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-emerald-200/50 bg-white/80 backdrop-blur-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/50 transition-all duration-300 text-gray-900 placeholder-gray-500"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full max-w-xs px-4 py-4 rounded-2xl border-2 border-emerald-200/50 bg-white/80 backdrop-blur-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/50 transition-all duration-300 text-gray-900"
            >
              <option value="ALL">All</option>
              <option value="FARMER">Farmer</option>
              <option value="CONSULTANT">Consultant</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-200/50">
                <tr className="text-left">
                  <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Name</th>
                  <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Email</th>
                  <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Phone</th>
                  <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Role</th>
                  <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Joined</th>
                  <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100/50">
                {loading && (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-4"><div className="h-4 w-40 bg-gray-200 rounded-lg" /></td>
                        <td className="p-4"><div className="h-4 w-48 bg-gray-200 rounded-lg" /></td>
                        <td className="p-4"><div className="h-4 w-28 bg-gray-200 rounded-lg" /></td>
                        <td className="p-4"><div className="h-6 w-20 bg-gray-200 rounded-full" /></td>
                        <td className="p-4"><div className="h-4 w-24 bg-gray-200 rounded-lg" /></td>
                        <td className="p-4 text-right"><div className="h-10 w-10 bg-gray-200 rounded-lg ml-auto" /></td>
                      </tr>
                    ))}
                  </>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Users</h3>
                      <p className="text-red-600 mb-4">{error}</p>
                      <button
                        onClick={loadUsers}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Try Again
                      </button>
                    </td>
                  </tr>
                )}

                {!loading && !error && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                      <p className="text-gray-600 mb-6">Try adjusting your search criteria or refresh the data.</p>
                      <button
                        onClick={loadUsers}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Data
                      </button>
                    </td>
                  </tr>
                )}

                {!loading && !error && filtered.map((u, idx) => (
                  <tr key={u._id} className="group border-b border-emerald-100/50 hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-transparent transition-all duration-300">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        {u.profilePicture || u.avatar || u.photoURL || u.picture || u.image || u.profilePic || u.profilePicture ? (
                          <img
                            src={u.profilePicture || u.avatar || u.photoURL || u.picture || u.image || u.profilePic || u.profilePicture}
                            alt={`${u.firstName} ${u.lastName}`}
                            className="h-12 w-12 rounded-xl object-cover border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-lg group-hover:scale-105 transition-transform duration-200 ${u.profilePicture || u.avatar || u.photoURL || u.picture || u.image || u.profilePic || u.profilePicture ? 'hidden' : 'flex'}`}
                        >
                          {initials(`${u.firstName || ""} ${u.lastName || ""}`) || "U"}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">#{u._id?.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-700 truncate max-w-[260px]" title={u.email}>
                        {u.email}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {u.phone || "-"}
                    </td>
                    <td className="p-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        title="Delete User"
                        className="group/btn relative p-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-red-500/20"
                        onClick={() => deleteUser(u._id)}
                      >
                        <FiTrash2 className="text-lg group-hover/btn:scale-110 transition-transform duration-200" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-emerald-700">{count}</span> {count === 1 ? "record" : "records"}
          </div>
          <div className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}
