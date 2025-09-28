import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";
import AppointmentCard from "../../components/AppointmentCard";

export default function MyBookings() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const q = status ? `?status=${status}` : "";
      // backend route you already have: GET /appointments/my
      const { data } = await API.get(`/appointments/my${q}`);
      setRows(Array.isArray(data) ? data : data?.items || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const onEdit = (appt) => {
    if (!appt?._id) return;
    navigate(`/appointment/${appt._id}/edit`, { state: { appt } });
  };

  const onCancel = async (appt) => {
    if (!appt?._id) return;
    if (!window.confirm("Cancel this appointment?")) return;
    await API.post(`/appointments/${appt._id}/cancel`);
    load();
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
            key={r._id || r.id}
            appt={r}
            role="farmer"
            onEdit={onEdit}
            onCancel={onCancel}
            onOpen={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
