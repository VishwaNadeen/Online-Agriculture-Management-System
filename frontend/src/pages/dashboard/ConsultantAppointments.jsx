// src/pages/dashboard/ConsultantAppointments.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  CalendarDays,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
  Eye,
  CheckCheck,
  Ban,
} from "lucide-react";
import API from "../../utils/api";

// Appointment card lives at src/components/appointmentCard.jsx
import AppointmentCard from "../../components/appointmentCard.jsx";

/* ------------------ helpers ------------------ */
const STATUS_OPTIONS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Upcoming" },
  { key: "declined", label: "Declined" },
  { key: "cancelled", label: "Cancelled" },
  { key: "completed", label: "Completed" },
];

const prettyDate = (d) =>
  d ? new Date(d).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }) : "-";

export default function ConsultantAppointments() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState(""); // filter: "", "pending","confirmed","declined","cancelled","completed"
  const [q, setQ] = useState(""); // search by client name/email/phone
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(null); // for details modal
  const [refreshKey, setRefreshKey] = useState(0);

  /* ------------------ load list ------------------ */
  async function load() {
    setLoading(true);
    setErr("");
    try {
      const query = new URLSearchParams();
      if (status) query.set("status", status);
      if (q.trim()) query.set("q", q.trim());
      const qs = query.toString();
      const { data } = await API.get(`/appointments/my-consultant${qs ? `?${qs}` : ""}`);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load appointments";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, refreshKey]);
  // Debounced search: load 400ms after typing stops
  useEffect(() => {
    const t = setTimeout(() => load(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  /* ------------------ actions ------------------ */
  const confirmAppt = async (appt) => {
    if (!window.confirm("Confirm this appointment?")) return;
    try {
      const res = await API.post(`/appointments/${appt._id}/confirm`);
      const sent = !!res?.data?.emailSent;
      toast.success(sent ? "Appointment confirmed. Email sent to client." : "Appointment confirmed. Email not sent.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to confirm");
    }
  };

  const declineAppt = async (appt) => {
    const reason = window.prompt("Reason (optional):") || "";
    try {
      const res = await API.post(`/appointments/${appt._id}/decline`, { reason });
      const sent = !!res?.data?.emailSent;
      toast.success(sent ? "Appointment declined. Email sent to client." : "Appointment declined. Email not sent.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to decline");
    }
  };

  const cancelAppt = async (appt) => {
    const ok = window.confirm("Cancel this confirmed appointment?");
    if (!ok) return;
    try {
      await API.post(`/appointments/${appt._id}/cancel`);
      toast.success("Appointment cancelled");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to cancel");
    }
  };

  const completeAppt = async (appt) => {
    const ok = window.confirm("Mark this appointment as completed?");
    if (!ok) return;
    try {
      await API.post(`/appointments/${appt._id}/complete`);
      toast.success("Appointment marked as completed");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to mark completed");
    }
  };

  /* ------------------ derived ------------------ */
  const counts = useMemo(() => {
    const c = { total: rows.length };
    for (const s of ["pending", "confirmed", "declined", "cancelled", "completed"]) {
      c[s] = rows.filter((r) => r.status === s).length;
    }
    return c;
  }, [rows]);

  /* ------------------ render ------------------ */
  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl font-semibold">My Appointments (Consultant)</h2>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search client name / email / phone"
              className="pl-8 pr-3 py-2 border rounded-lg text-sm w-64"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-2 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <StatBox label="Total" value={counts.total} icon={<CalendarDays className="w-4 h-4" />} />
        <StatBox label="Pending" value={counts.pending} icon={<Clock3 className="w-4 h-4" />} />
        <StatBox label="Upcoming" value={counts.confirmed} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
        <StatBox label="Declined" value={counts.declined} icon={<XCircle className="w-4 h-4 text-red-500" />} />
        <StatBox label="Completed" value={counts.completed} icon={<CheckCheck className="w-4 h-4 text-emerald-700" />} />
      </div>

      {/* Alerts */}
      {err && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {err}
        </div>
      )}

      {/* List */}
      {loading && <ListSkeleton />}

      {!loading && rows.length === 0 && !err && (
        <EmptyState />
      )}

      {!loading && rows.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((r) => (
            <AppointmentCard
              key={r._id}
              appt={r}
              role="consultant"
              onConfirm={() => confirmAppt(r)}
              onDecline={() => declineAppt(r)}
              onCancel={() => cancelAppt(r)}
              onComplete={() => completeAppt(r)}
              onOpen={() => setSelected(r)}
            />
          ))}
        </div>
      )}

      {/* Details modal */}
      {selected && (
        <DetailsModal appt={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/* ------------------ small UI pieces ------------------ */
function StatBox({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-gray-400">{icon}</div>
      </div>
      <div className="mt-1 text-2xl font-semibold">{value ?? 0}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
      <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
        <CalendarDays className="w-5 h-5 text-emerald-600" />
      </div>
      <div className="font-medium">No appointments found</div>
      <div className="text-sm">Try changing filters or refreshing.</div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-4">
          <div className="h-5 w-2/3 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}

function DetailsModal({ appt, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center bg-black/40">
      <div className="w-full md:max-w-xl bg-white rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="font-semibold">Appointment Details</div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="p-5 space-y-3 text-sm">
          <Row label="Appointment No">
            {appt.appointmentId ? `#${String(appt.appointmentId).padStart(5, "0")}` : "-"}
          </Row>
          <Row label="Status"><Badge status={appt.status} /></Row>
          <Row label="Date & Time">{prettyDate(appt.appointmentDate || appt.appointmentDateISO)}</Row>
          <Row label="Client">{appt.name} ({appt.email})</Row>
          <Row label="Phone">{appt.phone || "-"}</Row>
          <Row label="Category">{appt.category || "-"}</Row>
          <Row label="Location">
            {[appt.state, appt.city, appt.address].filter(Boolean).join(", ") || "-"}
          </Row>
          {appt.reason && <Row label="Reason/Notes">{appt.reason}</Row>}
        </div>

        <div className="px-5 py-4 border-t bg-gray-50 flex flex-wrap gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex gap-3">
      <div className="w-36 shrink-0 text-gray-500">{label}</div>
      <div className="flex-1 text-gray-800">{children}</div>
    </div>
  );
}

function Badge({ status }) {
  const map = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    declined: "bg-red-50 text-red-700 border-red-200",
    cancelled: "bg-gray-50 text-gray-700 border-gray-200",
    completed: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs ${map[status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
      {status || "unknown"}
    </span>
  );
}
