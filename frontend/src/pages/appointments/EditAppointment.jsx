// src/pages/appointments/EditAppointment.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppointmentForm from "./AppointmentForm.jsx";
import { ApptAPI } from "../../api/appointments.js";

export default function EditAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState(null);
  const [serverMsg, setServerMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const appt = await ApptAPI.get(id);
        // map to form shape if backend differs
        setInitial({
          ...appt,
          appointmentDate: (appt.appointmentDate || appt.appointmentDateISO || "").slice(0,10),
        });
      } catch (e) {
        setServerMsg({ type: "error", text: e.message || "Failed to load appointment" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleUpdate = async (payload) => {
    await ApptAPI.update(id, payload);
    setServerMsg({ type: "success", text: "Appointment updated." });
    navigate("/appointments"); // back to list
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (!initial) return <div className="p-6 text-rose-700">Not found.</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h2 className="text-3xl font-bold text-emerald-700">Edit Appointment</h2>
      {serverMsg && (
        <div className={`mt-4 rounded-xl border px-6 py-4 text-sm ${serverMsg.type==="success"?"border-emerald-200 bg-emerald-50 text-emerald-800":"border-rose-200 bg-rose-50 text-rose-800"}`}>
          {serverMsg.text}
        </div>
      )}
      <AppointmentForm
        initialValues={initial}
        onSubmit={handleUpdate}
        submitLabel="Save Changes"
        serverMsg={serverMsg}
        setServerMsg={setServerMsg}
      />
    </div>
  );
}
