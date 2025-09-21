// src/pages/appointments/CreateAppointment.jsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppointmentForm from "./AppointmentForm.jsx";
import { ApptAPI } from "../../api/appointments.js";

export default function CreateAppointment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [serverMsg, setServerMsg] = useState(null);

  const prefill = useMemo(() => {
    const p = location.state?.person || {};
    return {
      city: p.city || "",
      category: p.category || "",
      consultantId: p.consultantId || "",
      consultantName: p.consultantName || "",
    };
  }, [location.state]);

  const handleCreate = async (payload) => {
    const appt = await ApptAPI.create(payload);
    setServerMsg({ type: "success", text: "Appointment created successfully." });
    // optional: redirect to list
    navigate("/appointments");
    return appt;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h2 className="text-3xl font-bold text-emerald-700">Book Appointment</h2>
      {serverMsg && (
        <div className={`mt-4 rounded-xl border px-6 py-4 text-sm ${serverMsg.type==="success"?"border-emerald-200 bg-emerald-50 text-emerald-800":"border-rose-200 bg-rose-50 text-rose-800"}`}>
          {serverMsg.text}
        </div>
      )}
      <AppointmentForm
        initialValues={prefill}
        onSubmit={handleCreate}
        submitLabel="Schedule Consultation"
        serverMsg={serverMsg}
        setServerMsg={setServerMsg}
      />
    </div>
  );
}
