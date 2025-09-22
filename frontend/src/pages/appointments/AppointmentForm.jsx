// src/pages/appointments/AppointmentForm.jsx
import React, { useMemo, useState, useEffect } from "react";

/* ===== Options ===== */
const CATEGORY_OPTIONS = [
  "Crop Consultation","Soil Testing","Pest Control","Irrigation Planning",
  "Harvesting Support","Equipment Maintenance","Organic Farming","Livestock Consultation",
];
const PERIOD_OPTIONS = ["morning", "afternoon", "evening"];

/* ===== Inputs ===== */
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
        error ? "border-red-500 ring-2 ring-red-200 focus:ring-red-300"
              : `border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 hover:border-gray-400 ${className}`
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
        error ? "border-red-500 ring-2 ring-red-200 focus:ring-red-300"
              : `border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 hover:border-gray-400 ${className}`
      }`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

/* Helpers */
const ensureInOptions = (list, value) => (value && !list.includes(value) ? [value, ...list] : list);
const dateOnlyToNoonISO = (dateStr) => {
  const [y,m,d] = dateStr.split("-").map(Number);
  return new Date(y, m-1, d, 12, 0, 0).toISOString();
};

export default function AppointmentForm({
  initialValues = {},
  onSubmit,
  submitLabel = "Schedule Consultation",
   
  setServerMsg,


  
}) {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(() => ({
    name: "", phone: "", email: "", state: "", city: "",
    address: "", category: "", appointmentDate: todayStr,
    timeMode: "period", appointmentTime: "morning", durationHours: 1, notes: "",
    consultantId: "", consultantName: "",
    ...initialValues,
  }));

  useEffect(() => { setForm((p) => ({ ...p, ...initialValues })); }, [initialValues]);

  const categoryOptions = useMemo(
    () => ensureInOptions(CATEGORY_OPTIONS, form.category),
    [form.category]
  );

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateForm = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Full name is required";
    if (!form.phone?.trim()) e.phone = "Mobile number is required";
    if (!form.email?.trim()) e.email = "Email address is required";
    if (!form.state?.trim()) e.state = "Province is required";
    if (!form.city?.trim()) e.city = "District/City is required";
    if (!form.category) e.category = "Service category is required";
    if (!form.appointmentDate) e.appointmentDate = "Appointment date is required";
    if (!form.appointmentTime) e.appointmentTime = "Appointment time is required";
    if (!form.durationHours || Number(form.durationHours) < 1)
      e.durationHours = "Duration must be at least 1 hour";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMsg?.(null);
    const v = validateForm();
    if (Object.keys(v).length) return setErrors(v);

    const payload = { ...form, appointmentDateISO: dateOnlyToNoonISO(form.appointmentDate) };

    try {
      setSubmitting(true);
      await onSubmit(payload);
    } catch (err) {
      setServerMsg?.({ type: "error", text: err.message || "Failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-8">
      {/* Personal */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
        <h3 className="text-lg font-semibold text-emerald-800 mb-6">Personal Information</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Input id="name" label="Full Name" required value={form.name} onChange={(e)=>setField("name", e.target.value)} error={errors.name}/>
          <Input id="phone" label="Mobile Number" required value={form.phone} onChange={(e)=>setField("phone", e.target.value)} error={errors.phone}/>
          <Input id="email" label="Email Address" required type="email" value={form.email} onChange={(e)=>setField("email", e.target.value)} error={errors.email} className="md:col-span-2"/>
        </div>
      </div>

      {/* Location */}
      <div className="bg-gradient-to-r from-lime-50 to-emerald-50 rounded-xl p-6 border border-lime-100">
        <h3 className="text-lg font-semibold text-lime-800 mb-6">Farm Location Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Input id="state" label="Province" required value={form.state} onChange={(e)=>setField("state", e.target.value)} error={errors.state}/>
          <Input id="city" label="District / City" required value={form.city} onChange={(e)=>setField("city", e.target.value)} error={errors.city}/>
          <Input id="address" label="Farm Address" value={form.address} onChange={(e)=>setField("address", e.target.value)} className="md:col-span-2"/>
        </div>
      </div>

      {/* Service */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-100">
        <h3 className="text-lg font-semibold text-green-800 mb-6">Service Requirements</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Select id="category" label="Service Category" required value={form.category} onChange={(e)=>setField("category", e.target.value)} error={errors.category}>
            <option value="">Select Agricultural Service</option>
            {categoryOptions.map((opt)=>(<option key={opt} value={opt}>{opt}</option>))}
          </Select>
          <Input id="appointmentDate" label="Preferred Date" required type="date"
                 min={useMemo(()=>new Date().toISOString().split("T")[0],[])}
                 value={form.appointmentDate} onChange={(e)=>setField("appointmentDate", e.target.value)}
                 error={errors.appointmentDate}/>
        </div>
      </div>

      {/* Time */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
        <h3 className="text-lg font-semibold text-teal-800 mb-6">Time Scheduling</h3>
        <div className="space-y-6">
          <div className="flex items-center gap-8">
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <input type="radio" name="timeMode" checked={form.timeMode==="period"} onChange={()=>{
                setForm((p)=>({ ...p, timeMode:"period", appointmentTime: PERIOD_OPTIONS.includes(p.appointmentTime)?p.appointmentTime:"morning" }));
                setErrors((prev)=>({ ...prev, appointmentTime: undefined }));
              }}/>
              <span className="text-base font-medium text-teal-700">Time Period</span>
            </label>
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <input type="radio" name="timeMode" checked={form.timeMode==="exact"} onChange={()=>{
                setForm((p)=>({ ...p, timeMode:"exact", appointmentTime: PERIOD_OPTIONS.includes(p.appointmentTime)?"09:00":(p.appointmentTime||"09:00") }));
                setErrors((prev)=>({ ...prev, appointmentTime: undefined }));
              }}/>
              <span className="text-base font-medium text-teal-700">Exact Time</span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {form.timeMode==="period" ? (
              <Select id="appointmentTime" label="Preferred Time Period" required value={form.appointmentTime} onChange={(e)=>setField("appointmentTime", e.target.value)} error={errors.appointmentTime}>
                {PERIOD_OPTIONS.map((opt)=>(<option key={opt} value={opt}>{opt[0].toUpperCase()+opt.slice(1)}</option>))}
              </Select>
            ) : (
              <Input id="appointmentTime" label="Exact Time" required type="time" value={form.appointmentTime} onChange={(e)=>setField("appointmentTime", e.target.value)} error={errors.appointmentTime}/>
            )}

            <Input id="durationHours" label="Expected Duration (hours)" required type="number" min="1" max="240" step="1"
                   value={form.durationHours} onChange={(e)=>setField("durationHours", e.target.value===""?"":+e.target.value)} error={errors.durationHours}/>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
        <h3 className="text-lg font-semibold text-amber-800 mb-6">Additional Information</h3>
        <div className="space-y-3">
          <label htmlFor="notes" className="block text-sm font-medium text-amber-800">
            Special Requirements & Notes (max 1000 characters)
          </label>
          <textarea id="notes" name="notes" rows={5} className={`w-full rounded-lg border px-4 py-3 text-base outline-none transition-all duration-300 bg-white/90 resize-vertical ${
              errors.notes ? "border-red-500 ring-2 ring-red-200" : "border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            }`}
            value={form.notes} onChange={(e)=>setField("notes", e.target.value)} maxLength={1000}
            placeholder="Please specify: crop types, farm size, equipment access, specific concerns, etc."/>
          {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
          <div className="text-sm text-amber-600">{form.notes?.length || 0}/1000 characters used</div>
        </div>
      </div>

      {/* Hidden consultant fields */}
      <input type="hidden" value={form.consultantId} readOnly />
      <input type="hidden" value={form.consultantName} readOnly />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
        <button type="submit" disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl">
          {submitting ? "Processing..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
