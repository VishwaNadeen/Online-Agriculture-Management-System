// src/pages/appointments/EditAppointment.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppointmentForm from "./AppointmentForm.jsx";
import { ApptAPI } from "../../api/appointments.js";

/* ---------------- helpers ---------------- */
const toYMD = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date)) return String(d).slice(0, 10); // fallback if backend stores "YYYY-MM-DD"
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

const combineDateTimeToISO = (yyyy_mm_dd, hh_mm) => {
  if (!yyyy_mm_dd) return undefined;
  const t = (hh_mm && /^\d{2}:\d{2}$/.test(hh_mm)) ? `${hh_mm}:00` : "00:00:00";
  const local = new Date(`${yyyy_mm_dd}T${t}`);
  if (isNaN(local)) return undefined;
  return local.toISOString();
};

const stripImmutable = (obj) => {
  const clone = { ...obj };
  [
    "_id",
    "id",
    "__v",
    "createdAt",
    "updatedAt",
    "created_by",
    "patient",
    "consultant",
  ].forEach((k) => delete clone[k]);
  return clone;
};

const normalizeTypes = (obj) => {
  const out = { ...obj };
  Object.keys(out).forEach((k) => {
    if (typeof out[k] === "string") out[k] = out[k].trim();
  });
  ["fee", "durationMinutes"].forEach((k) => {
    if (out[k] !== undefined && out[k] !== null && out[k] !== "") {
      const n = Number(out[k]);
      if (!Number.isNaN(n)) out[k] = n;
    }
  });
  return out;
};

const readError = (e) => {
  const data = e?.response?.data;
  if (!data) return e.message || "Request failed";
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (Array.isArray(data.errors) && data.errors.length) {
    return data.errors
      .map((er) => er.msg || er.message || `${er.path}: invalid`)
      .join("\n");
  }
  if (data.error) return typeof data.error === "string" ? data.error : JSON.stringify(data.error);
  return JSON.stringify(data);
};

export default function EditAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState(null);
  const [serverMsg, setServerMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setServerMsg(null);
        const appt = await ApptAPI.get(id);

        const dateYMD = toYMD(appt.appointmentDate || appt.appointmentDateISO || appt.date);
        const timeHHMM =
          appt.appointmentTime?.slice?.(0, 5) ||
          (appt.appointmentDate && new Date(appt.appointmentDate).toTimeString().slice(0, 5));

        setInitial({
          ...appt,
          appointmentDate: dateYMD,
          appointmentTime: timeHHMM || "",
        });
      } catch (e) {
        setServerMsg({
          type: "error",
          text: readError(e) || "Failed to load appointment",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleUpdate = async (formValues) => {
    try {
      setSubmitting(true);
      setServerMsg(null);

      const cleaned = stripImmutable(formValues);
      const iso = combineDateTimeToISO(cleaned.appointmentDate, cleaned.appointmentTime);
      if (iso) cleaned.appointmentDate = iso;

      const payload = normalizeTypes(cleaned);
      await ApptAPI.update(id, payload);

      setServerMsg({ type: "success", text: "Appointment updated." });
      navigate("/my-appointments");
    } catch (e) {
      setServerMsg({ type: "error", text: readError(e) });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (!initial) return <div className="p-6 text-rose-700">Not found.</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header with Back button */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-emerald-700">Edit Appointment</h2>
        
      </div>

      {serverMsg && (
        <div
          className={`mt-4 whitespace-pre-wrap rounded-xl border px-6 py-4 text-sm ${
            serverMsg.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {serverMsg.text}
        </div>
      )}

      <AppointmentForm
        initialValues={initial}
        onSubmit={handleUpdate}
        submitLabel={submitting ? "Saving…" : "Save Changes"}
        serverMsg={serverMsg}
        setServerMsg={setServerMsg}
        disabled={submitting}
      />
    </div>
  );
}
