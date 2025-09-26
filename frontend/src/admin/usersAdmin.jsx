// src/admin/users/UsersAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FiSearch, FiPlus, FiMoreVertical, FiTrash2 } from "react-icons/fi";
import { MdEdit } from "react-icons/md";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function UsersAdmin() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE}/api/admin/users`);
      const rows = Array.isArray(res.data) ? res.data : (res.data?.users || []);
      setUsers(rows);
    } catch (err) {
      console.error(err);
      // fallback so UI works even if API is not ready
      setUsers([
        { _id: "u1", firstName: "Kamal", lastName: "Perera", email: "kamal@gg.lk", phone: "0771234567", role: "farmer", status: "ACTIVE", createdAt: "2025-08-01" },
        { _id: "u2", firstName: "Nimali", lastName: "Silva",  email: "nimali@gg.lk", phone: "0719876543", role: "consultant", status: "PENDING", createdAt: "2025-08-12" },
        { _id: "u3", firstName: "Admin",  lastName: "User",   email: "admin@gg.lk", phone: "0705555555", role: "admin", status: "ACTIVE", createdAt: "2025-07-22" },
      ]);
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
      await axios.delete(`${BASE}/api/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      // optional: toast.success("User deleted");
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  const handleCreate = async (payload) => {
    try {
      // you can keep create local-only (no backend) or hit POST if you have it
      const fallback = { _id: crypto.randomUUID(), ...payload, status: "ACTIVE", createdAt: new Date().toISOString() };
      setUsers((prev) => [fallback, ...prev]);
      setShowCreate(false);
    } catch {
      setShowCreate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-green-700">Users</h1>
          <p className="text-gray-600">Manage farmers, consultants, and admins.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            className="px-3 py-2 rounded-lg border hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800"
          >
            <FiPlus /> Add User
          </button>
        </div>
      </div>

      {/* Filters (client-side only) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone..."
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
      <div className="bg-white shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
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
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500">No users found.</td></tr>
              )}
              {!loading && filtered.map((u) => (
                <tr key={u._id} className="border-t">
                  <Td>
                    <div className="font-medium text-gray-800">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-gray-500">#{u._id?.slice(-6)}</div>
                  </Td>
                  <Td>{u.email}</Td>
                  <Td>{u.phone || "-"}</Td>
                  <Td><RoleBadge role={u.role} /></Td>
                  <Td><StatusBadge status={u.status} /></Td>
                  <Td>{formatDate(u.createdAt)}</Td>
                  <Td className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        title="Edit"
                        className="p-2 rounded hover:bg-gray-100"
                        onClick={() => alert("Open edit for " + (u.email || u._id))}
                      >
                        <MdEdit />
                      </button>
                      <button
                        title="Delete"
                        className="p-2 rounded hover:bg-red-50 text-red-600"
                        onClick={() => deleteUser(u._id)}
                      >
                        <FiTrash2 />
                      </button>
                      <button title="More" className="p-2 rounded hover:bg-gray-100">
                        <FiMoreVertical />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}

/* ---- Small UI helpers (unchanged) ---- */
function Th({ children, className = "" }) {
  return <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
function RoleBadge({ role }) {
  const r = (role || "").toLowerCase();
  const map = {
    farmer: "bg-emerald-100 text-emerald-700",
    consultant: "bg-amber-100 text-amber-700",
    admin: "bg-indigo-100 text-indigo-700",
  };
  return <span className={`text-xs px-2 py-1 rounded ${map[r] || "bg-gray-100 text-gray-700"}`}>{r || "-"}</span>;
}
function StatusBadge({ status }) {
  const s = (status || "").toUpperCase();
  const map = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    INACTIVE: "bg-red-100 text-red-700",
  };
  return <span className={`text-xs px-2 py-1 rounded ${map[s] || "bg-gray-100 text-gray-700"}`}>{s || "-"}</span>;
}
function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/* ---- Create Modal (kept same) ---- */
function CreateUserModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", role: "farmer",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onCreate(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-lg">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add New User</h3>
          <button className="text-gray-500 hover:text-gray-800" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="First Name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
            <Input label="Last Name"  value={form.lastName}  onChange={(v) => setForm({ ...form, lastName: v })}  required />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="farmer">Farmer</option>
              <option value="consultant">Consultant</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border" disabled={saving}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-60" disabled={saving}>
              {saving ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function Input({ label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
      />
    </div>
  );
}
