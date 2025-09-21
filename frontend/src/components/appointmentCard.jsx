// src/components/AppointmentCard.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function AppointmentCard({ appt, onDelete }) {
  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{appt.name}</h4>
          <p className="text-emerald-600 font-medium">{appt.category}</p>
        </div>
        <div className="text-sm text-gray-500">
          ID: {appt._id || appt.appointmentId}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm text-gray-700">
        <div><span className="font-medium">📅 Date:</span><br/>{appt.appointmentDate || (appt.appointmentDateISO || "").slice(0,10)}</div>
        <div><span className="font-medium">🕒 Time:</span><br/>{appt.appointmentTime}</div>
        <div><span className="font-medium">⏱️ Duration:</span><br/>{appt.durationHours} h</div>
        <div><span className="font-medium">📍 City:</span><br/>{appt.city}</div>
      </div>

      <div className="flex gap-3 mt-4">
        <Link to={`/appointments/${appt._id || appt.appointmentId}/edit`} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Edit</Link>
        <button onClick={() => onDelete(appt)} className="px-4 py-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200">Delete</button>
      </div>
    </div>
  );
}
