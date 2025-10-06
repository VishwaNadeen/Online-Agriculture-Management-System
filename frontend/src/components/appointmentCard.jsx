// src/components/AppointmentCard.jsx
import React from "react";
import StatusChip from "./StatusChip";

/**
 * Props:
 *  - appt (object)
 *  - role: "farmer" | "consultant"
 *  - onOpen(appt)
 *  - onConfirm(appt)     // consultant: confirm
 *  - onDecline(appt)     // consultant: decline
 *  - onCancel(appt)      // farmer: cancel
 *  - onEdit(appt)        // farmer: edit
 */
export default function AppointmentCard({
  appt,
  role,
  onOpen,
  onConfirm,
  onDecline,
  onCancel,
  onEdit,
}) {
  const dateStr = (() => {
    const d = appt.appointmentDate || appt.appointmentDateISO || appt.dateISO || appt.date;
    if (!d) return "-";
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  })();

  const timeStr = appt.appointmentTime || appt.time || "-";
  const duration = appt.durationHours ? `${appt.durationHours} h` : appt.duration ? `${appt.duration} min` : "-";
  const city = appt.city || "-";
  const status = (appt.status || "pending").toLowerCase();

  const apptNo = appt.appointmentId ? `#${String(appt.appointmentId).padStart(5, "0")}` : "-";

  const otherPartyName =
    role === "consultant"
      ? appt?.farmer?.firstName || appt?.name || "Farmer"
      : appt?.consultant?.firstName || appt?.consultantName || "Consultant";

  const canConsultantAct = role === "consultant" && status === "pending";
  const canFarmerCancel = role === "farmer" && ["pending", "confirmed"].includes(status);

  return (
    <div
      className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition hover:-translate-y-[1px] cursor-pointer"
      onClick={() => onOpen?.(appt)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" ? onOpen?.(appt) : null)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-lg font-semibold text-gray-900 truncate">
              {otherPartyName}
            </h4>
            {appt.category && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {appt.category}
              </span>
            )}
            {apptNo !== "-" && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                {apptNo}
              </span>
            )}
          </div>

          {/* farmer meta */}
          {role !== "consultant" && appt.consultantName && (
            <div className="mt-1 text-sm text-gray-600 truncate">
              Consultant: <span className="font-medium text-gray-800">{appt.consultantName}</span>
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-gray-500">Status</div>
          <div className="mt-1">
            <StatusChip status={status} />
          </div>
        </div>
      </div>

      {/* Grid */}
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
        {(appt.email || appt.phone) && (
          <div className="md:col-span-4">
            <div className="text-gray-500">Contact</div>
            <div className="font-medium text-gray-800 truncate">
              {[appt.email, appt.phone].filter(Boolean).join(" • ")}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-5 justify-end">
       {/*} <button
          onClick={(e) => { e.stopPropagation(); onOpen?.(appt); }}
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
        >
          View
        </button>*/}

        {/* farmer: edit */}
        {role === "farmer" && onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(appt); }}
           className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"

          >
            Edit
          </button>
        )}

        {/* farmer: cancel */}
        {canFarmerCancel && onCancel && (
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(appt); }}
           className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"

          >
            Cancel
          </button>
        )}

        {/* consultant: confirm/decline */}
        {canConsultantAct && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onConfirm?.(appt); }}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Confirm
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDecline?.(appt); }}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
            >
              Decline
            </button>
          </>
        )}
      </div>
    </div>
  );
}
