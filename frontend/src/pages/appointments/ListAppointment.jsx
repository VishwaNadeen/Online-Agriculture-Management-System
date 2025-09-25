// src/pages/appointments/ListAppointments.jsx  
//display delete
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApptAPI } from "../../api/appointments.js";
import AppointmentCard from "../../components/AppointmentCard.jsx";

export default function ListAppointment() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await ApptAPI.list();
      setList(data);
    } catch (e) {
      setErr(e.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (appt) => {
    const id = appt._id || appt.appointmentId;
    const ok = window.confirm(`Delete appointment ${id}?`);
    if (!ok) return;
    try {
      await ApptAPI.remove(id);
      setList((prev) => prev.filter((x) => (x._id || x.appointmentId) !== id));
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-emerald-700">My Appointments</h2>
        <Link to="/SearchCon" className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">+ New</Link>
      </div>

      {loading && <div>Loading…</div>}
      {err && <div className="text-rose-700">{err}</div>}

      {!loading && !list.length ? (
        <div className="text-gray-600">No appointments yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {list.map((a) => (
            <AppointmentCard key={a._id || a.appointmentId} appt={a} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
