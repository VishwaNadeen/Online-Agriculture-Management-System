import React, { useState } from "react";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const URL  = `${BASE}/appointments`;

const CATEGORY_OPTIONS = [
  "Crop Consultation",
  "Soil Testing",
  "Pest Control",
  "Irrigation Planning",
  "Harvesting Support",
  "Equipment Maintenance",
  "Organic Farming",
  "Livestock Consultation",
];

const PERIOD_OPTIONS = ["morning", "afternoon", "evening"];

const Input = ({ id, label, error, className = "", ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
      {label} {props.required && <span className="text-red-500">*</span>}
    </label>
    <input
      id={id}
      name={id}
      autoComplete="off"
      className={`w-full rounded-lg border px-4 py-3 text-base outline-none transition-all duration-300 min-h-[48px] ${
        error
          ? "border-red-500 ring-2 ring-red-200 focus:ring-red-300"
          : `border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 hover:border-gray-400 ${className}`
      }`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

const Select = ({ id, label, error, className = "", children, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
      {label} {props.required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={id}
      name={id}
      className={`w-full rounded-lg border px-4 py-3 text-base outline-none transition-all duration-300 min-h-[48px] ${
        error
          ? "border-red-500 ring-2 ring-red-200 focus:ring-red-300"
          : `border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 hover:border-gray-400 ${className}`
      }`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

export default function AgriculturalBookingForm() {
  const [submitting, setSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState(null);
  const [errors, setErrors] = useState({});

  const todayStr = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    state: "",
    city: "",
    address: "",
    category: "",
    appointmentDate: todayStr,
    timeMode: "period",
    appointmentTime: "morning",
    durationHours: 1,
    notes: "",
  });

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateForm = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.phone.trim()) e.phone = "Mobile number is required";
    if (!form.email.trim()) e.email = "Email address is required";
    if (!form.state.trim()) e.state = "Province is required";
    if (!form.city.trim()) e.city = "District/City is required";
    if (!form.category) e.category = "Service category is required";
    if (!form.appointmentDate) e.appointmentDate = "Appointment date is required";
    if (!form.appointmentTime) e.appointmentTime = "Appointment time is required";
    if (!form.durationHours || Number(form.durationHours) < 1)
      e.durationHours = "Duration must be at least 1 hour";
    return e;
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      state: "",
      city: "",
      address: "",
      category: "",
      appointmentDate: todayStr,
      timeMode: "period",
      appointmentTime: "morning",
      durationHours: 1,
      notes: "",
    });
    setErrors({});
    setServerMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMsg(null);

    const v = validateForm();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token"); // if your POST is protected
      const res = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      let data = null;
      try { data = await res.json(); } catch (_) {}

      if (!res.ok) {
        const msg = data?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const id = data?.appointment?._id || `AGR-${Date.now().toString().slice(-6)}`;
      setServerMsg({
        type: "success",
        text: `Consultation scheduled successfully! Service ID: ${id}`,
      });
      resetForm();
    } catch (err) {
      setServerMsg({
        type: "error",
        text: `Failed to submit. ${err.message}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 min-h-screen">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-emerald-100 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 via-green-700 to-lime-700 bg-clip-text text-transparent mb-2">
            Agricultural Consultation Booking
          </h2>
          <p className="text-emerald-600 font-medium">Professional farm services at your doorstep</p>
        </div>

        {serverMsg && (
          <div
            className={`mt-4 rounded-xl border px-6 py-4 text-sm backdrop-blur-sm ${
              serverMsg.type === "success"
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-800 shadow-lg shadow-emerald-100"
                : "border-rose-200 bg-rose-50/80 text-rose-800 shadow-lg shadow-rose-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d={
                    serverMsg.type === "success"
                      ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      : "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  }
                  clipRule="evenodd"
                />
              </svg>
              {serverMsg.text}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Personal Information */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
            <h3 className="text-lg font-semibold text-emerald-800 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
              </svg>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                id="name"
                label="Full Name"
                required
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g., Mahinda Perera"
                error={errors.name}
                className="bg-white/90 border-emerald-200"
              />

              <Input
                id="phone"
                label="Mobile Number"
                required
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+94 77 123 4567"
                error={errors.phone}
                className="bg-white/90 border-emerald-200"
              />

              <Input
                id="email"
                label="Email Address"
                required
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="farmer@example.lk"
                error={errors.email}
                className="bg-white/90 border-emerald-200 md:col-span-2"
              />
            </div>
          </div>

          {/* Farm Location */}
          <div className="bg-gradient-to-r from-lime-50 to-emerald-50 rounded-xl p-6 border border-lime-100">
            <h3 className="text-lg font-semibold text-lime-800 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              Farm Location Details
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                id="state"
                label="Province"
                required
                value={form.state}
                onChange={(e) => setField("state", e.target.value)}
                placeholder="e.g., Western Province"
                error={errors.state}
                className="bg-white/90 border-lime-200"
              />

              <Input
                id="city"
                label="District / City"
                required
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                placeholder="e.g., Gampaha"
                error={errors.city}
                className="bg-white/90 border-lime-200"
              />

              <Input
                id="address"
                label="Farm Address"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="Village, lane, farm name (optional)"
                className="bg-white/90 border-lime-200 md:col-span-2"
              />
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-green-800 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
              Service Requirements
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Select
                id="category"
                label="Service Category"
                required
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                error={errors.category}
                className="bg-white/90 border-green-200"
              >
                <option value="">Select Agricultural Service</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Select>

              <Input
                id="appointmentDate"
                label="Preferred Date"
                required
                type="date"
                min={todayStr}
                value={form.appointmentDate}
                onChange={(e) => setField("appointmentDate", e.target.value)}
                error={errors.appointmentDate}
                className="bg-white/90 border-green-200"
              />
            </div>
          </div>

          {/* Time Preference */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
            <h3 className="text-lg font-semibold text-teal-800 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
              </svg>
              Time Scheduling
            </h3>

            <div className="space-y-6">
              <div className="flex items-center gap-8">
                <label className="inline-flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="timeMode"
                    className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-teal-300"
                    checked={form.timeMode === "period"}
                    onChange={() => {
                      setForm((p) => ({
                        ...p,
                        timeMode: "period",
                        appointmentTime: PERIOD_OPTIONS.includes(p.appointmentTime)
                          ? p.appointmentTime
                          : "morning",
                      }));
                      setErrors((prev) => ({ ...prev, appointmentTime: undefined }));
                    }}
                  />
                  <span className="text-base font-medium text-teal-700">Time Period</span>
                </label>

                <label className="inline-flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="timeMode"
                    className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-teal-300"
                    checked={form.timeMode === "exact"}
                    onChange={() => {
                      setForm((p) => ({
                        ...p,
                        timeMode: "exact",
                        appointmentTime: PERIOD_OPTIONS.includes(p.appointmentTime)
                          ? "09:00"
                          : p.appointmentTime || "09:00",
                      }));
                      setErrors((prev) => ({ ...prev, appointmentTime: undefined }));
                    }}
                  />
                  <span className="text-base font-medium text-teal-700">Exact Time</span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {form.timeMode === "period" ? (
                  <Select
                    id="appointmentTime"
                    label="Preferred Time Period"
                    required
                    value={form.appointmentTime}
                    onChange={(e) => setField("appointmentTime", e.target.value)}
                    error={errors.appointmentTime}
                    className="bg-white/90 border-teal-200"
                  >
                    {PERIOD_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt[0].toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id="appointmentTime"
                    label="Exact Time"
                    required
                    type="time"
                    value={form.appointmentTime}
                    onChange={(e) => setField("appointmentTime", e.target.value)}
                    error={errors.appointmentTime}
                    className="bg-white/90 border-teal-200"
                  />
                )}

                <Input
                  id="durationHours"
                  label="Expected Duration (hours)"
                  required
                  type="number"
                  min="1"
                  max="240"
                  step="1"
                  value={form.durationHours}
                  onChange={(e) =>
                    setField("durationHours", e.target.value === "" ? "" : +e.target.value)
                  }
                  error={errors.durationHours}
                  className="bg-white/90 border-teal-200"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
            <h3 className="text-lg font-semibold text-amber-800 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              Additional Information
            </h3>
            <div className="space-y-3">
              <label htmlFor="notes" className="block text-sm font-medium text-amber-800">
                Special Requirements & Notes (max 1000 characters)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={5}
                autoComplete="off"
                className={`w-full rounded-lg border px-4 py-3 text-base outline-none transition-all duration-300 bg-white/90 backdrop-blur-sm resize-vertical ${
                  errors.notes
                    ? "border-red-500 ring-2 ring-red-200 focus:ring-red-300"
                    : "border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 hover:border-amber-300"
                }`}
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                maxLength={1000}
                placeholder="Please specify: crop types, farm size, equipment access, specific concerns, etc."
              />
              {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
              <div className="text-sm text-amber-600">{form.notes.length}/1000 characters used</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              {submitting ? "Processing..." : "Schedule Consultation"}
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={resetForm}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl border-2 border-amber-300 bg-white/80 backdrop-blur-sm px-8 py-4 text-base font-medium text-amber-800 shadow-lg hover:bg-amber-50 hover:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl"
            >
              Reset Form
            </button>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-emerald-100">
            <p className="text-sm text-emerald-700 bg-emerald-50/80 rounded-lg px-4 py-3 inline-flex items-center gap-2">
              Your consultation will be confirmed within 24 hours. A unique{" "}
              <code className="rounded bg-emerald-100 px-2 py-1 font-mono text-xs">service ID</code>{" "}
              will be assigned for tracking.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
