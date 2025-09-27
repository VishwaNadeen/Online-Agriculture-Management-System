// src/pages/appointments/CreateAppointment.jsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppointmentForm from "./AppointmentForm.jsx";
import { ApptAPI } from "../../api/appointments.js";

function to24h(t) {
  // accepts "2:30 PM" | "14:30" | "14.30" etc. -> "14:30"
  if (!t) return "";
  const s = String(t).trim().replace(".", ":");
  const ampm = s.match(/am|pm/i)?.[0]?.toLowerCase();
  const [hh, mm = "00"] = s.replace(/am|pm/i, "").trim().split(":");
  let H = parseInt(hh, 10);
  if (Number.isNaN(H)) return "";
  if (ampm === "pm" && H < 12) H += 12;
  if (ampm === "am" && H === 12) H = 0;
  const HH = String(H).padStart(2, "0");
  const MM = String(parseInt(mm, 10) || 0).padStart(2, "0");
  return `${HH}:${MM}`;
}

export default function CreateAppointment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [serverMsg, setServerMsg] = useState(null);

  const prefill = useMemo(() => {
    const p = location.state?.person || {};
    return {
      city: p.city || "",
      category: p.category || "",
      consultantId: p.consultantId || p._id || "", // 🔹 NEW: try _id fallback
      consultantName: p.consultantName || p.name || "",
    };
  }, [location.state]);

  const handleCreate = async (payload) => {
    try {
      // 🔹 NEW: normalize to what backend expects
      const phone =
        (payload.phone && String(payload.phone).trim()) ||
        `${payload.mobileCountry || ""}${String(payload.mobileNumber || "").replace(/\D/g, "")}`;

      // Use period values as-is; convert only exact time inputs
      const timeValue = payload.timeMode === "period"
        ? payload.appointmentTime // e.g., "morning" | "afternoon" | "evening" (backend maps to HH:mm)
        : to24h(payload.appointmentTime);
      const dateISO = (() => {
        if (!payload.appointmentDate) return "";
        // if payload.appointmentDate is "2025-09-27", combine with time (default 09:00)
        const datePart = String(payload.appointmentDate).slice(0, 10);
        const timePart = (payload.timeMode === "period" ? "09:00" : timeValue) || "09:00";
        const iso = new Date(`${datePart}T${timePart}:00`);
        return Number.isNaN(iso.getTime()) ? "" : iso.toISOString();
      })();

      const body = {
        name: (payload.fullName || payload.name || "").trim(),
        email: (payload.email || "").trim(),
        phone,
        state: payload.state || payload.province || "",
        city: payload.city || "",
        address: payload.address || "",
        category: payload.category || "",
        consultantId: payload.consultantId || prefill.consultantId || "", // keep if your API requires it
        appointmentDate: dateISO,      // send ISO (most controllers prefer this)
        appointmentTime: timeValue,    // keep separate too; backend validates/normalizes
        notes: payload.notes || payload.reason || "",
      };

      // remove empty keys (prevents “invalid data” if controller is strict)
      Object.keys(body).forEach((k) => {
        if (body[k] === "" || body[k] === undefined || body[k] === null) delete body[k];
      });

      // minimal client-side guard for most common 400s
      const required = ["name", "email", "phone", "city", "category", "appointmentDate"];
      for (const k of required) {
        if (!body[k]) throw new Error(`Missing required field: ${k}`);
      }

      const appt = await ApptAPI.create(body);
      setServerMsg({ type: "success", text: "Appointment created successfully." });
      navigate("/my-appointments");
      return appt;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Invalid appointment data";
      setServerMsg({ type: "error", text: msg });
      console.error("Create appointment error:", err?.response?.data || err);
      return null;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h2 className="text-3xl font-bold text-emerald-700">Book Appointment</h2>

      {serverMsg && (
        <div
          className={`mt-4 rounded-xl border px-6 py-4 text-sm ${
            serverMsg.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
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
