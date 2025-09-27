import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import AppointmentCard from "../../components/appointmentCard";

/* ---- helpers: read cached user & token ---- */
function readUser() {
  try {
    return (
      JSON.parse(localStorage.getItem("auth_user") || "null") ||
      JSON.parse(sessionStorage.getItem("auth_user") || "null")
    );
  } catch {
    return null;
  }
}
function haveToken() {
  return (
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token")
  );
}

export default function MyAppointments() {
  const navigate = useNavigate();
  const user = readUser();

  // If not logged in, redirect politely
  useEffect(() => {
    if (!haveToken()) {
      toast.error("Please log in to view your appointments");
      navigate("/login", { replace: true, state: { from: "/my-appointments" } });
    }
  }, [navigate]);

  /* ---- role detection ---- */
  const isConsultant = useMemo(() => {
    if (!user) return false;
    const roles = Array.isArray(user?.roles)
      ? user.roles
      : user?.role
      ? [user.role]
      : [];
    return roles.includes("consultant");
  }, [user]);

  /* ---- state ---- */
  const [statusFilter, setStatusFilter] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---- load list based on role ---- */
  async function load() {
    setLoading(true);
    try {
      const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const url = isConsultant
        ? `/appointments/my-consultant${q}`
        : `/appointments/my${q}`;
      const { data } = await api.get(url);
      setRows(Array.isArray(data) ? data : data?.appointments || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConsultant, statusFilter]);

  /* ---- actions ---- */
  const handleConfirm = async (appt) => {
    try {
      await api.post(`/appointments/${appt._id}/confirm`);
      toast.success("Appointment confirmed");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to confirm");
    }
  };
  const handleDecline = async (appt) => {
    const reason = prompt("Reason (optional):") || "";
    try {
      await api.post(`/appointments/${appt._id}/decline`, { reason });
      toast.success("Appointment declined");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to decline");
    }
  };
  const handleCancel = async (appt) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await api.post(`/appointments/${appt._id}/cancel`);
      toast.success("Appointment cancelled");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to cancel");
    }
  };

  /* ---- labels ---- */
  const pageTitle = isConsultant ? "Received Appointments" : "My Bookings";
  const pageSubtitle = isConsultant
    ? "Requests sent to you as a consultant."
    : "Appointments you have booked.";

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-500">{pageSubtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="status" className="text-sm text-gray-600">
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="pending">{isConsultant ? "Pending (needs action)" : "Pending"}</option>
            <option value="confirmed">Confirmed</option>
            <option value="declined">Declined</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading && <div className="text-gray-500">Loading...</div>}
      {!loading && rows.length === 0 && (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-600">
          {isConsultant ? "No appointments received." : "No bookings yet."}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((r) => (
          <AppointmentCard
            key={r._id}
            appt={r}
            role={isConsultant ? "consultant" : "farmer"}
            onOpen={() => {}}
            onConfirm={isConsultant ? handleConfirm : undefined}
            onDecline={isConsultant ? handleDecline : undefined}
            onCancel={!isConsultant ? handleCancel : undefined}
          />
        ))}
      </div>
    </div>
  );
}
