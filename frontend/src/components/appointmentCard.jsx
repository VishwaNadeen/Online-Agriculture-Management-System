// src/components/AppointmentCard.jsx
import React from "react";

/**
 * Props:
 *  - appt
 *  - onDelete(appt)
 *  - onOpen(appt)   // ADD: open details modal when card clicked
 */
export default function AppointmentCard({ appt, onDelete, onOpen }) {
  const dateStr = (() => {
    const d = appt.appointmentDate || appt.appointmentDateISO;
    if (!d) return "-";
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  })();

  const timeStr = appt.appointmentTime || "-";
  const duration = appt.durationHours ? `${appt.durationHours} h` : "-";
  const city = appt.city || "-";
  const status = appt.status || "pending";

  // Use friendly number, hide Mongo _id
  const apptNo = appt.appointmentId ? `#${String(appt.appointmentId).padStart(5, "0")}` : "-";

  const statusClass =
    status === "confirmed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "cancelled"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div
      className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition hover:-translate-y-[1px] cursor-pointer"
      onClick={() => onOpen?.(appt)} // ADD
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" ? onOpen?.(appt) : null)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-lg font-semibold text-gray-900 truncate">{appt.name}</h4>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm font-medium text-emerald-700">{appt.category}</span>
          </div>

          {/* Consultant shown right under title if available */}
          {appt.consultantName && (
            <div className="mt-1 text-sm text-gray-600">Consultant: <span className="font-medium text-gray-800">{appt.consultantName}</span></div>
          )}
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-gray-500">Appointment</div>
          <div className="text-sm font-semibold text-gray-900">{apptNo}</div>
          <span className={`inline-flex mt-1 items-center rounded-full border px-2 py-0.5 text-xs ${statusClass}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm text-gray-700">
        <div>
          <div className="text-gray-500">Date</div>
          <div className="font-medium">{dateStr}</div>
        </div>
        <div>
          <div className="text-gray-500">Time</div>
          <div className="font-medium">{timeStr}</div>
        </div>
        <div>
          <div className="text-gray-500">Duration</div>
          <div className="font-medium">{duration}</div>
        </div>
        <div>
          <div className="text-gray-500">City</div>
          <div className="font-medium">{city}</div>
        </div>
      </div>

      {/* Actions row stays clickable but won't trigger onOpen when clicking buttons */}
      <div className="flex gap-3 mt-5">
        <button
          onClick={(e) => { e.stopPropagation(); onOpen?.(appt); }} // ADD: open details
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
        >
          View
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(appt); }}
          className="px-4 py-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
