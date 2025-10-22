// src/admin/usersAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FiSearch, FiTrash2, FiDownload } from "react-icons/fi";
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
  const [status, setStatus] = useState("ALL");
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
    if (role !== "ALL") rows = rows.filter((u) => (u.role || "").toUpperCase() === role);
    if (status !== "ALL") rows = rows.filter((u) => (u.status || "").toUpperCase() === status);
    return rows;
  }, [users, q, role, status]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-green-700">Green Grow Users</h1>
            <p className="text-gray-600">Manage farmers and consultants.</p>
          </div>
        <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 ring-1 ring-green-200">
            {count} {count === 1 ? "user" : "users"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadUsersReport}
            disabled={downloading || loading || users.length === 0 || !pdfReady}
            className={`px-3 py-2 rounded-lg border shadow-sm inline-flex items-center gap-2 ${
              downloading || loading || users.length === 0 || !pdfReady
                ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed"
                : "bg-emerald-700 text-white border-emerald-600/50 hover:shadow-emerald-700/30"
            }`}
            title="Download Users Report (PDF)"
          >
            <FiDownload />
            {downloading ? "Preparing…" : !pdfReady ? "Preparing deps…" : "Download report"}
          </button>
          <button
            onClick={loadUsers}
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <option value="ALL">All Roles</option>
          <option value="FARMER">Farmer</option>
          <option value="CONSULTANT">Consultant</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-left text-gray-600">
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Joined</Th>
                <Th className="text-right pr-4">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <Td><div className="h-5 w-40 bg-gray-100 rounded" /></Td>
                      <Td><div className="h-5 w-48 bg-gray-100 rounded" /></Td>
                      <Td><div className="h-5 w-28 bg-gray-100 rounded" /></Td>
                      <Td><div className="h-5 w-20 bg-gray-100 rounded" /></Td>
                      <Td><div className="h-5 w-20 bg-gray-100 rounded" /></Td>
                      <Td><div className="h-5 w-24 bg-gray-100 rounded" /></Td>
                      <Td className="text-right pr-4"><div className="h-8 w-9 bg-gray-100 rounded-md ml-auto" /></Td>
                    </tr>
                  ))}
                </>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="inline-flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg ring-1 ring-red-200">
                      {error}
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="text-gray-600 font-medium">No users found</div>
                    <div className="text-gray-500 text-sm mt-1">Try adjusting filters or refresh.</div>
                  </td>
                </tr>
              )}

              {!loading && !error && filtered.map((u, idx) => (
                <tr key={u._id} className={idx % 2 ? "bg-white" : "bg-gray-50/40 hover:bg-gray-50"}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold ring-1 ring-emerald-200">
                        {initials(`${u.firstName || ""} ${u.lastName || ""}`) || "U"}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 leading-5">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-[11px] text-gray-500">#{u._id?.slice(-6)}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="max-w-[260px]"><div className="truncate">{u.email}</div></Td>
                  <Td className="whitespace-nowrap">{u.phone || "-"}</Td>
                  <Td><RoleBadge role={u.role} /></Td>
                  <Td><StatusBadge status={u.status} /></Td>
                  <Td className="whitespace-nowrap">{formatDate(u.createdAt)}</Td>
                  <Td className="text-right pr-4">
                    <button
                      title="Delete"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => deleteUser(u._id)}
                    >
                      <FiTrash2 />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Showing <span className="font-medium">{count}</span> {count === 1 ? "record" : "records"}.
      </div>
    </div>
  );
}
