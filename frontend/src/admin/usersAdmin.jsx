// src/admin/users/UsersAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FiSearch, FiTrash2, FiDownload } from "react-icons/fi";
import { createGreenGrowLetterShell } from "../utils/pdf/greenGrowLetterShell";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const SITE_NAME = import.meta.env.VITE_SITE_NAME || "Green Grow";

/* read token the same way you do elsewhere (for DELETE auth) */
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

/* --------- small script loader (for Chart.js & autoTable) ---------- */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const exists = Array.from(document.getElementsByTagName("script")).some(
      (s) => s.src && s.src.includes(src)
    );
    if (exists) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}

async function ensureAutoTable() {
  // greenGrowLetterShell loads jsPDF; we only ensure autoTable here
  if (!window.jspdf?.jsPDF?.API?.autoTable) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
  }
  if (!window.jspdf?.jsPDF?.API?.autoTable) {
    throw new Error("autoTable failed to load");
  }
}

async function ensureChartJs() {
  if (!window.Chart) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js");
  }
  if (!window.Chart) throw new Error("Chart.js failed to load");
}

/* --------- stats builders for charts --------- */
function buildStats(users) {
  const total = users.length;

  // Role distribution (farmer/consultant/admin/user)
  const roleCounts = users.reduce((acc, u) => {
    const r = (u.role || "user").toLowerCase();
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});
  const roleLabels = ["user", "farmer", "consultant", "admin"];
  const roleData = roleLabels.map((k) => roleCounts[k] || 0);

  // Status distribution (ACTIVE/PENDING/INACTIVE)
  const statusCounts = users.reduce((acc, u) => {
    const s = (u.status || "ACTIVE").toUpperCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const statusLabels = ["ACTIVE", "PENDING", "INACTIVE"];
  const statusData = statusLabels.map((k) => statusCounts[k] || 0);

  // Monthly signups (last 12 months)
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString(undefined, { month: "short", year: "2-digit" }),
    });
  }
  const monthIndex = months.reduce((acc, m, idx) => ((acc[m.key] = idx), acc), {});
  const monthly = new Array(12).fill(0);
  users.forEach((u) => {
    const dt = new Date(u.createdAt || u.createdDate || u.created_at || u.created_on);
    if (!Number.isNaN(dt)) {
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthIndex) monthly[monthIndex[key]]++;
    }
  });

  return {
    total,
    role: { labels: roleLabels.map((s) => s.toUpperCase()), data: roleData },
    status: { labels: statusLabels, data: statusData },
    monthly: { labels: months.map((m) => m.label), data: monthly },
  };
}

/* --------- make a chart image (off-screen) --------- */
async function renderChartToDataURL({ type, labels, data, title }) {
  await ensureChartJs();

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = type === "bar" ? 520 : 460;
  const ctx = canvas.getContext("2d");

  // eslint-disable-next-line no-undef
  const chart = new Chart(ctx, {
    type,
    data: { labels, datasets: [{ label: title, data, borderWidth: 1 }] },
    options: {
      responsive: false,
      plugins: { legend: { display: type !== "bar" }, title: { display: true, text: title } },
      scales: type === "bar" ? { y: { beginAtZero: true, ticks: { precision: 0 } } } : {},
    },
  });

  await new Promise((r) => setTimeout(r, 30));
  const url = canvas.toDataURL("image/png", 1.0);
  chart.destroy();
  return url;
}

export default function UsersAdmin() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [downloading, setDownloading] = useState(false);

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

  useEffect(() => { loadUsers(); }, []);

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

  /* ---------------- PDF Download using Green Grow Letter Shell ---------------- */
  const downloadUsersReport = async () => {
    try {
      if (loading) { alert("Please wait until data loads."); return; }
      if (!Array.isArray(users) || users.length === 0) { alert("No users to export."); return; }

      setDownloading(true);

      // Create the letter shell (header + footer); jsPDF is loaded inside it
      const { doc, margins, contentWidth, addPage, save } = await createGreenGrowLetterShell();

      // Ensure autoTable is available (for the users table)
      await ensureAutoTable();

      // Build stats & charts (optional but nice)
      const stats = buildStats(users);
      const nowStr = new Date().toLocaleString(undefined, {
        year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
      });

      // Render charts as images
      const roleChart = await renderChartToDataURL({
        type: "doughnut", labels: stats.role.labels, data: stats.role.data, title: "Users by Role",
      });
      const statusChart = await renderChartToDataURL({
        type: "doughnut", labels: stats.status.labels, data: stats.status.data, title: "Users by Status",
      });
      const monthlyChart = await renderChartToDataURL({
        type: "bar", labels: stats.monthly.labels, data: stats.monthly.data, title: "Monthly Sign-ups (Last 12 Months)",
      });

      /* ==== BODY CONTENT (inside shell margins) ==== */
      let y = margins.top;
      const x = margins.left;

      // Title & meta
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`${SITE_NAME} — Users Report`, x, y); y += 6;

      doc.setDrawColor(4, 120, 87); // emerald-700 line
      doc.setLineWidth(0.6);
      doc.line(x, y, x + contentWidth, y); y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated on: ${nowStr}`, x, y);
      y += 8;

      // Summary bullets
      doc.setFontSize(11);
      doc.text(`Total Users: ${stats.total}`, x, y); y += 6;
      doc.text(`By Role (USER/FARMER/CONSULTANT/ADMIN): ${stats.role.data.join(" / ")}`, x, y); y += 6;
      doc.text(`By Status (ACTIVE/PENDING/INACTIVE): ${stats.status.data.join(" / ")}`, x, y); y += 10;

      // Charts row (two doughnuts)
      const doughnutW = (contentWidth - 6) / 2;
      const doughnutH = doughnutW * 0.62;
      if (y + doughnutH > (doc.internal.pageSize.getHeight() - margins.bottom)) { addPage(); y = margins.top; }
      doc.addImage(roleChart, "PNG", x, y, doughnutW, doughnutH);
      doc.addImage(statusChart, "PNG", x + doughnutW + 6, y, doughnutW, doughnutH);
      y += doughnutH + 8;

      // Monthly bar chart
      const barW = contentWidth;
      const barH = barW * 0.42;
      if (y + barH > (doc.internal.pageSize.getHeight() - margins.bottom)) { addPage(); y = margins.top; }
      doc.addImage(monthlyChart, "PNG", x, y, barW, barH);
      y += barH + 10;

      // Users table
      if (y > (doc.internal.pageSize.getHeight() - margins.bottom - 20)) { addPage(); y = margins.top; }
      const head = [[ "#", "Name", "Email", "Phone", "Role", "Status", "Joined" ]];
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
        headStyles: { fillColor: [209, 250, 229], textColor: 0 }, // emerald-100
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

      // Save
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
            disabled={downloading || loading || users.length === 0}
            className={`px-3 py-2 rounded-lg border shadow-sm inline-flex items-center gap-2 ${
              downloading || loading || users.length === 0
                ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed"
                : "bg-emerald-700 text-white border-emerald-600/50 hover:shadow-emerald-700/30"
            }`}
            title="Download Users Report (PDF)"
          >
            <FiDownload />
            {downloading ? "Preparing…" : "Download report"}
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

      {/* Table Card */}
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
                <tr
                  key={u._id}
                  className={idx % 2 ? "bg-white" : "bg-gray-50/40 hover:bg-gray-50"}
                >
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
                  <Td className="max-w-[260px]">
                    <div className="truncate">{u.email}</div>
                  </Td>
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

      {/* Footer hint */}
      <div className="text-xs text-gray-500">
        Showing <span className="font-medium">{count}</span> {count === 1 ? "record" : "records"}.
      </div>
    </div>
  );
}
