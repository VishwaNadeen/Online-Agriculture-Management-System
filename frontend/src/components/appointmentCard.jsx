// src/components/AppointmentCard.jsx
import React from "react";
import StatusChip from "./StatusChip";

/**
 * Props:
 *  - appt (object)
 *  - role: "farmer" | "consultant"
 *  - onOpen(appt)        // open details modal/page
 *  - onConfirm(appt)     // consultant: confirm
 *  - onDecline(appt)     // consultant: decline
 *  - onCancel(appt)      // farmer: cancel
 *  - onDelete(appt)      // optional generic delete (admin or list cleanup)
 */
export default function AppointmentCard({
  appt,
  role,
  onOpen,
  onConfirm,
  onDecline,
  onCancel,
  onDelete,
}) {
  // ---- Derived display fields ----
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

  // Friendly number, hide Mongo _id
  const apptNo = appt.appointmentId
    ? `#${String(appt.appointmentId).padStart(5, "0")}`
    : "-";

  // Who is the other party name
  const otherPartyName =
    role === "consultant"
      ? appt?.farmer?.firstName || appt?.name || "Farmer"
      : appt?.consultant?.firstName || appt?.consultantName || "Consultant";

  // ---- Actions visibility ----
  const canConsultantAct =
    role === "consultant" && status === "pending" && (onConfirm || onDecline);
  const canFarmerCancel =
    role === "farmer" && ["pending", "confirmed"].includes(status) && onCancel;

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
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm font-medium text-emerald-700">
              {appt.category}
            </span>
          </div>

          {/* Show consultant for farmer side */}
          {role !== "consultant" && appt.consultantName && (
            <div className="mt-1 text-sm text-gray-600">
              Consultant:{" "}
              <span className="font-medium text-gray-800">
                {appt.consultantName}
              </span>
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-gray-500">Appointment</div>
          <div className="text-sm font-semibold text-gray-900">{apptNo}</div>
          {/* Only one status chip (remove manual pill) */}
          <div className="mt-1">
            <StatusChip status={status} />
          </div>
        </div>
      </div>

      {/* Grid details */}
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

        {appt.notes && (
          <div className="md:col-span-4">
            <div className="text-gray-500">Notes</div>
            <div className="font-medium">{appt.notes}</div>
          </div>
        )}

        {appt.declineReason && status === "declined" && (
          <div className="md:col-span-4">
            <div className="text-gray-500">Decline reason</div>
            <div className="font-medium text-rose-700">{appt.declineReason}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-5">
        {/* View */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen?.(appt);
          }}
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
        >
          View
        </button>

        {/* Farmer cancel */}
        {canFarmerCancel && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel?.(appt);
            }}
            className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900"
          >
            Cancel
          </button>
        )}

        {/* Consultant confirm/decline */}
        {canConsultantAct && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfirm?.(appt);
              }}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Confirm
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDecline?.(appt);
              }}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
            >
              Decline
            </button>
          </>
        )}

        {/* Optional: generic delete */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(appt);
            }}
            className="px-4 py-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
