// src/pages/dashboard/Dashboard.jsx
import { useMemo, useState } from "react";
import ConsultantAppointments from "./ConsultantAppointments";
import MyBookings from "./MyBookings";

function readAuthUser() {
  try {
    return JSON.parse(localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user") || "null");
  } catch { return null; }
}

export default function Dashboard() {
  const user = readAuthUser();
  const isConsultant = useMemo(() => {
    const roles = user?.roles || user?.role ? [user.role] : [];
    return roles.includes("consultant");
  }, [user]);

  const [tab, setTab] = useState(isConsultant ? "consultant" : "bookings");

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex gap-2 border-b mb-4">
        <button
          className={`px-3 py-2 ${tab==="bookings"?"border-b-2 border-green-600 font-semibold":""}`}
          onClick={() => setTab("bookings")}
        >My Bookings</button>

        {isConsultant && (
          <button
            className={`px-3 py-2 ${tab==="consultant"?"border-b-2 border-green-600 font-semibold":""}`}
            onClick={() => setTab("consultant")}
          >Consultant — My Appointments</button>
        )}
      </div>

      {tab === "bookings" && <MyBookings />}
      {tab === "consultant" && isConsultant && <ConsultantAppointments />}
    </div>
  );
}
