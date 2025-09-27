// src/pages/dashboard/ConsultantAppointments.jsx
import { useEffect, useState } from "react";
import API from "../../utils/api";
import AppointmentCard from "../../components/appointmentCard";

export default function ConsultantAppointments() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState(""); // "", "pending","confirmed","declined","cancelled","completed"
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const q = status ? `?status=${status}` : "";
      const { data } = await API.get(`/appointments/my-consultant${q}`);
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [status]);

  const doConfirm = async (appt) => {
    if (!confirm("Confirm this appointment?")) return;
    await API.post(`/appointments/${appt._id}/confirm`);
    load();
  };

  const doDecline = async (appt) => {
    const reason = prompt("Reason (optional):") || "";
    await API.post(`/appointments/${appt._id}/decline`, { reason });
    load();
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">My Appointments (Consultant)</h2>
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
      {!loading && rows.length === 0 && <div className="text-gray-500">No appointments.</div>}

      <div className="grid md:grid-cols-2 gap-3">
        {rows.map((r) => (
          <AppointmentCard
            key={r._id}
            appt={r}
            role="consultant"
            onConfirm={doConfirm}
            onDecline={doDecline}
          />
        ))}
      </div>
    </div>
  );
}
