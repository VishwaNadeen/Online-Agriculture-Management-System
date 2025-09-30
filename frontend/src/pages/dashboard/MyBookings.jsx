// src/pages/dashboard/MyBookings.jsx
import { useEffect, useState } from "react";
import API from "../../utils/api";
import AppointmentCard from "../../components/appointmentCard";
import AppointmentDetailsModal from "../../components/AppointmentDetailsModal";

export default function MyBookings() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const q = status ? `?status=${status}` : "";
      const { data } = await API.get(`/appointments/my-bookings${q}`);
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [status]);

  const doCancel = async (appt) => {
    if (!confirm("Cancel this appointment?")) return;
    await API.post(`/appointments/${appt._id}/cancel`);
    await load();
    setOpen(false);
  };

  const doDelete = async (appt) => {
    if (!confirm("Delete this appointment permanently?")) return;
    await API.delete(`/appointments/${appt._id}`);
    await load();
    setOpen(false);
  };

  const onOpenDetails = (appt) => {
    setActive(appt);
    setOpen(true);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">My Bookings</h2>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Upcoming</option>
          <option value="declined">Declined</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading && <div>Loading...</div>}
      {!loading && rows.length === 0 && <div className="text-gray-500">No bookings.</div>}

      <div className="grid md:grid-cols-2 gap-3">
        {rows.map((r) => (
          <AppointmentCard
            key={r._id}
            appt={r}
            role="farmer"
            onOpen={onOpenDetails}
            onCancel={doCancel}
            onDelete={doDelete}
          />
        ))}
      </div>

      <AppointmentDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        appt={active || {}}
        role="farmer"
        onCancel={doCancel}
        onDelete={doDelete}
        // onEdit={(a) => navigate(`/appointment/${a._id}/edit`, { state:{ appt:a }})}
        // onDownload={(a) => ... }
      />
    </div>
  );
}
