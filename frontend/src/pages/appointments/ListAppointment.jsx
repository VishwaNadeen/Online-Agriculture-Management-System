// src/pages/appointments/ListAppointments.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApptAPI } from "../../api/appointments.js";
import AppointmentCard from "../../components/appointmentCard.jsx";
import AppointmentDetailsModal from "../../components/AppointmentDetailsModal.jsx"; // NEW
import axios from "axios";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function ListAppointment() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // NEW: modal state
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [consultant, setConsultant] = useState(null);
  const [loadingConsultant, setLoadingConsultant] = useState(false);

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

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (appt) => {
    const id = appt._id || appt.appointmentId;
    const ok = window.confirm(
      `Delete appointment ${appt.appointmentId ? `#${appt.appointmentId}` : id}?`
    );
    if (!ok) return;
    try {
      await ApptAPI.remove(appt._id); // send Mongo _id
      setList((prev) => prev.filter((x) => (x._id || x.appointmentId) !== id));
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  };

  const openDetails = async (appt) => {
    setActive(appt);
    setConsultant(null);
    setOpen(true);

    if (appt.consultantId) {
      try {
        setLoadingConsultant(true);
        const { data } = await axios.get(`${BASE}/consultants/${appt.consultantId}`);
        setConsultant(data?.consultant || data);
      } catch {
        // ignore
      } finally {
        setLoadingConsultant(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content grows */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-emerald-700">My Appointments</h2>
          <Link
            to="/SearchCon"
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            + New
          </Link>
        </div>

        {loading && <div className="text-gray-600">Loading…</div>}
        {err && <div className="text-rose-700">{err}</div>}

        {!loading && !list.length ? (
          <div className="text-gray-600 bg-white border border-gray-200 rounded-2xl p-8 text-center">
            No appointments yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {list.map((a) => (
              <AppointmentCard
                key={a._id || a.appointmentId}
                appt={a}
                onDelete={onDelete}
                onOpen={openDetails}
              />
            ))}
          </div>
        )}

        <AppointmentDetailsModal
          open={open}
          onClose={() => setOpen(false)}
          appt={active || {}}
          consultant={loadingConsultant ? null : consultant}
        />
      </main>
    </div>
  );
}
