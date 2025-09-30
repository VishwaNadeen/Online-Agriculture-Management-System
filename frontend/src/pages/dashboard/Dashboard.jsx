// src/pages/appointments/AppointmentForm.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Calendar, Clock, MapPin, FileText, User, Phone, Mail, Briefcase } from "lucide-react";

/* ===== Options ===== */
const CATEGORY_OPTIONS = [
  "Crop Consultation", "Soil Testing", "Pest Control", "Irrigation Planning",
  "Harvesting Support", "Equipment Maintenance", "Organic Farming", "Livestock Consultation",
];

const PERIOD_OPTIONS = ["morning", "afternoon", "evening"];
const DURATION_OPTIONS = [
  { value: 1, label: "1 hour" },
  { value: 2, label: "2 hours" },
  { value: 3, label: "3 hours" },
  { value: 4, label: "4 hours" },
  { value: 6, label: "6 hours (Half day)" },
  { value: 8, label: "8 hours (Full day)" },
];

const PHONE_CODES = [
  { code: "+94", country: "Sri Lanka" },
  { code: "+1", country: "US/Canada" },
  { code: "+44", country: "UK" },
  { code: "+91", country: "India" },
  { code: "+86", country: "China" },
  { code: "+81", country: "Japan" },
  { code: "+61", country: "Australia" },
  { code: "+27", country: "South Africa" },
];

/* ===== Inputs ===== */
const Input = ({ id, label, error, success, warning, icon: Icon, className = "", onBlur, ...props }) => (
  <div className="group">
    <label htmlFor={id} className="block text-sm font-semibold text-emerald-800 mb-2">
      {label} {props.required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Icon className="w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
        </div>
      )}
      <input
        id={id}
        name={id}
        autoComplete="off"
        className={`w-full rounded-xl border-2 ${Icon ? "pl-12" : "pl-4"} pr-4 py-3 text-emerald-900 placeholder-emerald-400 transition-all ${
          error
            ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:border-[3px]"
            : success
            ? "border-green-400 bg-green-50/50 focus:border-green-500 focus:border-[3px]"
            : warning
            ? "border-amber-400 bg-amber-50/50 focus:border-amber-500 focus:border-[3px]"
            : `border-emerald-200 bg-emerald-50/50 focus:border-emerald-600 focus:border-[3px] ${className}`
        } focus:outline-none`}
        onBlur={onBlur}
        {...props}
      />
    </div>
    {error && (
      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
        <span className="text-red-500">⚠</span> {error}
      </p>
    )}
    {success && <p className="mt-2 text-sm text-green-600 flex items-center gap-1">✓ {success}</p>}
    {warning && <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">ℹ️ {warning}</p>}
  </div>
);

const Select = ({ id, label, error, success, icon: Icon, className = "", children, onBlur, ...props }) => (
  <div className="group">
    <label htmlFor={id} className="block text-sm font-semibold text-emerald-800 mb-2">
      {label} {props.required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
          <Icon className="w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
        </div>
      )}
      <select
        id={id}
        name={id}
        className={`w-full rounded-xl border-2 ${Icon ? "pl-12" : "pl-4"} pr-4 py-3 text-emerald-900 transition-all ${
          error
            ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:border-[3px]"
            : success
            ? "border-green-400 bg-green-50/50 focus:border-green-500 focus:border-[3px]"
            : `border-emerald-200 bg-emerald-50/50 focus:border-emerald-600 focus:border-[3px] ${className}`
        } focus:outline-none`}
        onBlur={onBlur}
        {...props}
      >
        {children}
      </select>
    </div>
    {error && (
      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
        <span className="text-red-500">⚠</span> {error}
      </p>
    )}
    {success && <p className="mt-2 text-sm text-green-600 flex items-center gap-1">✓ {success}</p>}
  </div>
);

/* ===== Validation ===== */
const validators = {
  name: (v) => {
    if (!v?.trim()) return "Full name is required";
    if (v.length < 2) return "Name must be at least 2 characters";
    if (v.length > 50) return "Name must be less than 50 characters";
    if (!/^[a-zA-Z0-9\s\-'.]+$/.test(v)) return "Use letters, numbers, spaces, - and ' only";
    return null;
  },
  phone: (v) => {
    if (!v?.trim()) return "Mobile number is required";
    const digits = v.replace(/\D/g, "");
    if (digits.length < 8) return "Phone number is too short";
    if (digits.length > 15) return "Phone number is too long";
    if (!/^\d+$/.test(digits)) return "Phone number can only contain digits";
    return null;
  },
  email: (v) => {
    if (!v?.trim()) return "Email address is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(v)) return "Please enter a valid email address";
    if (v.length > 100) return "Email address is too long";
    return null;
  },
  state: (v) => {
    if (!v?.trim()) return "Province is required";
    if (v.length < 2) return "Province name is too short";
    if (v.length > 50) return "Province name is too long";
    return null;
  },
  city: (v) => {
    if (!v?.trim()) return "District/City is required";
    if (v.length < 2) return "City name is too short";
    if (v.length > 50) return "City name is too long";
    return null;
  },
  category: (v) => (!v ? "Service category is required" : null),
  appointmentDate: (v) => {
    if (!v) return "Appointment date is required";
    const selected = new Date(v);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) return "Appointment date cannot be in the past";
    const max = new Date();
    max.setFullYear(today.getFullYear() + 1);
    if (selected > max) return "Appointment date cannot be more than 1 year ahead";
    return null;
  },
  appointmentTime: (v, form) => {
    if (!v) return "Appointment time is required";
    if (form.timeMode === "period") {
      if (!["morning", "afternoon", "evening"].includes(v)) {
        return "Choose morning/afternoon/evening";
      }
      return null;
    }
    const ok = /^\d{2}:\d{2}$/.test(v);
    if (!ok) return "Use HH:mm format";
    const [hours, minutes] = v.split(":").map(Number);
    if (hours < 6 || (hours === 22 && minutes > 0) || hours > 22) {
      return "Appointments available between 06:00 and 22:00";
    }
    const todayStr = new Date().toISOString().split("T")[0];
    if (form.appointmentDate === todayStr) {
      const now = new Date();
      const appt = new Date(`${todayStr}T${v}`);
      if (appt < now) return "Appointment time cannot be in the past";
    }
    return null;
  },
  durationHours: (v) => {
    if (!v || v < 1) return "Duration must be at least 1 hour";
    if (v > 8) return "Duration cannot exceed 8 hours";
    return null;
  },
  notes: (v) => (v && v.length > 1000 ? "Notes cannot exceed 1000 characters" : null),
  consultantId: (v) => (!v ? "Consultant selection is required" : null),
};

const getSuccessMessages = {
  name: (v) => (v && v.length >= 2 ? "Name looks good!" : null),
  email: (v) => (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Valid email format" : null),
  phone: (v) => (v && v.replace(/\D/g, "").length >= 8 ? "Valid phone number" : null),
  state: (v) => (v && v.length >= 2 ? "Valid province name" : null),
  city: (v) => (v && v.length >= 2 ? "Valid city name" : null),
  category: (v) => (v ? "Service category selected" : null),
  appointmentDate: (v) => (v ? "Date selected" : null),
  appointmentTime: (v, form) => (v ? (form.timeMode === "period" ? "Time period selected" : "Time selected") : null),
  durationHours: (v) => (v ? "Duration set" : null),
};

/* ===== Utils ===== */
const ensureInOptions = (list, value) => (value && !list.includes(value) ? [value, ...list] : list);
const dateOnlyToNoonISO = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
};
const formatPhoneNumber = (value) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
};
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function AppointmentForm({
  initialValues = {},
  onSubmit,
  submitLabel = "Schedule Consultation",
  setServerMsg,
}) {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});
  const [warnings, setWarnings] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [countryCode, setCountryCode] = useState("+94");
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState(() => ({
    name: "", phone: "", email: "", state: "", city: "",
    address: "", category: "", appointmentDate: todayStr,
    timeMode: "period", appointmentTime: "morning", durationHours: 1, notes: "",
    consultantId: "", consultantName: "",
    ...initialValues,
  }));

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  useEffect(() => {
    setForm((p) => ({ ...p, ...initialValues }));
  }, [initialValues]);

  const debouncedValidation = useMemo(
    () =>
      debounce(() => {
        const newErrors = {};
        const newSuccess = {};
        const newWarnings = {};

        Object.keys(validators).forEach((field) => {
          if (touched[field] || form[field]) {
            const error = validators[field](form[field], field === "phone" ? countryCode : form);
            if (error) newErrors[field] = error;
            else if (getSuccessMessages[field]) {
              const successMsg = getSuccessMessages[field](form[field], form);
              if (successMsg) newSuccess[field] = successMsg;
            }
          }
        });

        if (form.notes && form.notes.length > 800) {
          newWarnings.notes = `Approaching character limit (${form.notes.length}/1000)`;
        }

        if (form.appointmentDate === todayStr && form.timeMode === "exact") {
          const [hours] = (form.appointmentTime || "").split(":").map(Number);
          const now = new Date().getHours();
          if (hours <= now + 1) {
            newWarnings.appointmentTime = "Short notice appointment - consultant availability may be limited";
          }
        }

        if (form.appointmentDate) {
          const date = new Date(form.appointmentDate);
          const day = date.getDay();
          if (day === 0 || day === 6) {
            newWarnings.appointmentDate = "Weekend appointment - additional charges may apply";
          }
        }

        setErrors(newErrors);
        setSuccess(newSuccess);
        setWarnings(newWarnings);
      }, 300),
    [form, touched, countryCode, todayStr]
  );

  useEffect(() => {
    debouncedValidation();
  }, [debouncedValidation]);

  const categoryOptions = useMemo(
    () => ensureInOptions(CATEGORY_OPTIONS, form.category),
    [form.category]
  );

  const setField = useCallback((key, value) => {
    setForm((prev) => {
      let processedValue = value;
      if (key === "phone" && value) processedValue = formatPhoneNumber(value);
      return { ...prev, [key]: processedValue };
    });
  }, []);

  const handleBlur = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    Object.keys(validators).forEach((field) => {
      const error = validators[field](form[field], field === "phone" ? countryCode : form);
      if (error) newErrors[field] = error;
    });
    return newErrors;
  }, [form, countryCode]);

  const isFormValid = useMemo(() => {
    const formErrors = validateForm();
    return Object.keys(formErrors).length === 0;
  }, [validateForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMsg?.(null);

    const allTouched = {};
    Object.keys(validators).forEach((field) => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const first = Object.keys(validationErrors)[0];
      const el = document.getElementById(first);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus({ preventScroll: true });
      }
      return;
    }

    const payload = {
      ...form,
      appointmentDateISO: dateOnlyToNoonISO(form.appointmentDate),
      phone: countryCode + form.phone.replace(/\D/g, ""),
    };

    try {
      setSubmitting(true);
      await onSubmit(payload);
    } catch (err) {
      setServerMsg?.({ type: "error", text: err.message || "Failed to schedule appointment" });
    } finally {
      setSubmitting(false);
    }
  };

  const clearField = (field) => {
    setField(field, "");
    setTouched((prev) => ({ ...prev, [field]: false }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSuccess((prev) => ({ ...prev, [field]: undefined }));
    setWarnings((prev) => ({ ...prev, [field]: undefined }));
  };

  const resetForm = () => {
    setForm({
      name: "", phone: "", email: "", state: "", city: "",
      address: "", category: "", appointmentDate: todayStr,
      timeMode: "period", appointmentTime: "morning", durationHours: 1, notes: "",
      consultantId: initialValues.consultantId || "",
      consultantName: initialValues.consultantName || "",
    });
    setTouched({});
    setErrors({});
    setSuccess({});
    setWarnings({});
    setCountryCode("+94");
  };

  return (
    <div className="min-h-screen w-full bg-green-50/95 px-4 py-12 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className={`relative bg-white shadow-xl p-8 rounded-3xl max-w-4xl w-full space-y-6 transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        noValidate
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Calendar className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
              Schedule Consultation
            </h2>
          </div>
          <p className="text-emerald-600">Book your agricultural consultation appointment</p>
        </div>

        {/* Personal Information */}
        <div className="space-y-5 pt-6">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <User className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              id="name"
              label="Full Name"
              icon={User}
              required
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              error={errors.name}
              success={success.name}
              placeholder="Enter your full name"
            />

            <div className="group">
              <label className="block text-sm font-semibold text-emerald-800 mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-28 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-3 py-3 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                >
                  {PHONE_CODES.map(({ code, country }) => (
                    <option key={code} value={code} title={country}>
                      {code}
                    </option>
                  ))}
                </select>
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Phone className="w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                  </div>
                  <input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    onBlur={() => handleBlur("phone")}
                    placeholder="123-456-7890"
                    className={`w-full rounded-xl border-2 pl-12 pr-10 py-3 text-emerald-900 placeholder-emerald-400 transition-all ${
                      errors.phone
                        ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:border-[3px]"
                        : success.phone
                        ? "border-green-400 bg-green-50/50 focus:border-green-500 focus:border-[3px]"
                        : "border-emerald-200 bg-emerald-50/50 focus:border-emerald-600 focus:border-[3px]"
                    } focus:outline-none`}
                  />
                  {form.phone && (
                    <button
                      type="button"
                      onClick={() => clearField("phone")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl font-bold"
                      title="Clear phone number"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              {errors.phone && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="text-red-500">⚠</span> {errors.phone}
                </p>
              )}
              {success.phone && <p className="mt-2 text-sm text-green-600 flex items-center gap-1">✓ {success.phone}</p>}
            </div>
          </div>

          <Input
            id="email"
            label="Email Address"
            icon={Mail}
            required
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            error={errors.email}
            success={success.email}
            placeholder="your.email@example.com"
          />
        </div>

        {/* Location Information */}
        <div className="space-y-5 pt-6">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Farm Location Details</h3>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              id="state"
              label="Province"
              icon={MapPin}
              required
              value={form.state}
              onChange={(e) => setField("state", e.target.value)}
              onBlur={() => handleBlur("state")}
              error={errors.state}
              success={success.state}
              placeholder="Enter your province"
            />
            <Input
              id="city"
              label="District / City"
              icon={MapPin}
              required
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
              onBlur={() => handleBlur("city")}
              error={errors.city}
              success={success.city}
              placeholder="Enter your district or city"
            />
          </div>

          <Input
            id="address"
            label="Farm Address"
            icon={MapPin}
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            onBlur={() => handleBlur("address")}
            placeholder="Full farm address with landmarks"
          />
        </div>

        {/* Service Requirements */}
        <div className="space-y-5 pt-6">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <Briefcase className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Service Requirements</h3>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Select
              id="category"
              label="Service Category"
              icon={Briefcase}
              required
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              onBlur={() => handleBlur("category")}
              error={errors.category}
              success={success.category}
            >
              <option value="">Select Agricultural Service</option>
              {categoryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>

            <Input
              id="appointmentDate"
              label="Preferred Date"
              icon={Calendar}
              required
              type="date"
              min={todayStr}
              max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0]}
              value={form.appointmentDate}
              onChange={(e) => setField("appointmentDate", e.target.value)}
              onBlur={() => handleBlur("appointmentDate")}
              error={errors.appointmentDate}
              success={success.appointmentDate}
              warning={warnings.appointmentDate}
            />
          </div>
        </div>

        {/* Time Scheduling */}
        <div className="space-y-5 pt-6">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Time Scheduling</h3>
          </div>

          <div className="flex items-center gap-8">
            <label className="inline-flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="timeMode"
                checked={form.timeMode === "period"}
                onChange={() =>
                  setForm((p) => ({
                    ...p,
                    timeMode: "period",
                    appointmentTime: PERIOD_OPTIONS.includes(p.appointmentTime) ? p.appointmentTime : "morning",
                  }))
                }
                className="w-5 h-5 text-emerald-600 border-2 border-emerald-300 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-base font-semibold text-emerald-700 group-hover:text-emerald-800 transition-colors">
                Time Period
              </span>
            </label>
            <label className="inline-flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="timeMode"
                checked={form.timeMode === "exact"}
                onChange={() =>
                  setForm((p) => ({
                    ...p,
                    timeMode: "exact",
                    appointmentTime: PERIOD_OPTIONS.includes(p.appointmentTime) ? "09:00" : p.appointmentTime || "09:00",
                  }))
                }
                className="w-5 h-5 text-emerald-600 border-2 border-emerald-300 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-base font-semibold text-emerald-700 group-hover:text-emerald-800 transition-colors">
                Exact Time
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {form.timeMode === "period" ? (
              <Select
                id="appointmentTime"
                label="Preferred Time Period"
                icon={Clock}
                required
                value={form.appointmentTime}
                onChange={(e) => setField("appointmentTime", e.target.value)}
                onBlur={() => handleBlur("appointmentTime")}
                error={errors.appointmentTime}
                success={success.appointmentTime}
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt[0].toUpperCase() + opt.slice(1)}{" "}
                    ({opt === "morning" ? "6 AM - 12 PM" : opt === "afternoon" ? "12 PM - 6 PM" : "6 PM - 10 PM"})
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                id="appointmentTime"
                label="Exact Time"
                icon={Clock}
                required
                type="time"
                min="06:00"
                max="22:00"
                value={form.appointmentTime}
                onChange={(e) => setField("appointmentTime", e.target.value)}
                onBlur={() => handleBlur("appointmentTime")}
                error={errors.appointmentTime}
                success={success.appointmentTime}
                warning={warnings.appointmentTime}
              />
            )}

            <Select
              id="durationHours"
              label="Expected Duration"
              icon={Clock}
              required
              value={form.durationHours}
              onChange={(e) => setField("durationHours", parseInt(e.target.value) || 1)}
              onBlur={() => handleBlur("durationHours")}
              error={errors.durationHours}
              success={success.durationHours}
            >
              {DURATION_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-5 pt-6">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Additional Information</h3>
          </div>

          <div className="group">
            <label htmlFor="notes" className="block text-sm font-semibold text-emerald-800 mb-2">
              Special Requirements & Notes (max 1000 characters)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={5}
              className={`w-full rounded-xl border-2 px-4 py-3 text-emerald-900 placeholder-emerald-400 transition-all resize-vertical ${
                errors.notes
                  ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:border-[3px]"
                  : warnings.notes
                  ? "border-amber-400 bg-amber-50/50 focus:border-amber-500 focus:border-[3px]"
                  : "border-emerald-200 bg-emerald-50/50 focus:border-emerald-600 focus:border-[3px]"
              } focus:outline-none`}
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              onBlur={() => handleBlur("notes")}
              maxLength={1000}
              placeholder="Please specify: crop types, farm size, equipment access, specific concerns, etc."
            />
            {errors.notes && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.notes}
              </p>
            )}
            {warnings.notes && <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">ℹ️ {warnings.notes}</p>}
            <div
              className={`mt-2 text-sm font-medium ${
                form.notes?.length > 900 ? "text-red-600" : form.notes?.length > 800 ? "text-amber-600" : "text-gray-500"
              }`}
            >
              {form.notes?.length || 0}/1000 characters
            </div>
          </div>
        </div>

        {/* Hidden consultant fields */}
        <input type="hidden" id="consultantId" value={form.consultantId} readOnly />
        <input type="hidden" id="consultantName" value={form.consultantName} readOnly />
        {errors.consultantId && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <span className="text-red-500">⚠</span> {errors.consultantId}
          </p>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
          <button
            type="button"
            onClick={resetForm}
            className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-700 font-semibold shadow hover:bg-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 border-gray-200"
          >
            Reset Form
          </button>

          <button
            type="submit"
            disabled={submitting || !isFormValid}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] transform disabled:hover:scale-100"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              submitLabel
            )}
          </button>
        </div>

        {!isFormValid && (
          <div className="text-center text-sm text-gray-600 pt-2">
            Please complete all required fields to enable submission
          </div>
        )}
      </form>
    </div>
  );
}
