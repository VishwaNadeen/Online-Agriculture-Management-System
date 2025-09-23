// src/pages/appointments/AppointmentForm.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";

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
  { code: "+1", country: "US/Canada" },
  { code: "+44", country: "UK" },
  { code: "+91", country: "India" },
  { code: "+86", country: "China" },
  { code: "+81", country: "Japan" },
  { code: "+61", country: "Australia" },
  { code: "+27", country: "South Africa" },
];

/* ===== Enhanced Input Components ===== */
const Input = ({ id, label, error, success, warning, className = "", onBlur, ...props }) => (
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
        : success ? "border-green-500 ring-2 ring-green-200 focus:ring-green-300"
        : warning ? "border-amber-500 ring-2 ring-amber-200 focus:ring-amber-300"
        : `border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 hover:border-gray-400 ${className}`
      }`}
      onBlur={onBlur}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600 flex items-center gap-1">⚠️ {error}</p>}
    {success && <p className="mt-1 text-sm text-green-600 flex items-center gap-1">✓ {success}</p>}
    {warning && <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">ℹ️ {warning}</p>}
  </div>
);

const Select = ({ id, label, error, success, className = "", children, onBlur, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
      {label} {props.required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={id}
      name={id}
      className={`w-full rounded-lg border px-4 py-3 text-base outline-none transition-all duration-300 min-h-[48px] ${
        error ? "border-red-500 ring-2 ring-red-200 focus:ring-red-300"
        : success ? "border-green-500 ring-2 ring-green-200 focus:ring-green-300"
        : `border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 hover:border-gray-400 ${className}`
      }`}
      onBlur={onBlur}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-sm text-red-600 flex items-center gap-1">⚠️ {error}</p>}
    {success && <p className="mt-1 text-sm text-green-600 flex items-center gap-1">✓ {success}</p>}
  </div>
);

/* ===== Validation Helpers ===== */
const validators = {
  name: (value) => {
    if (!value?.trim()) return "Full name is required";
    if (value.length < 2) return "Name must be at least 2 characters";
    if (value.length > 50) return "Name must be less than 50 characters";
    // FIXED: Allow numbers in names by including 0-9 in the regex
    if (!/^[a-zA-Z0-9\s\-'.]+$/.test(value)) return "Name can only contain letters, numbers, spaces, hyphens, and apostrophes";
    return null;
  },

  phone: (value, countryCode) => {
    if (!value?.trim()) return "Mobile number is required";
    const cleanPhone = value.replace(/\D/g, '');
    if (cleanPhone.length < 8) return "Phone number is too short";
    if (cleanPhone.length > 15) return "Phone number is too long";
    if (!/^\d+$/.test(cleanPhone)) return "Phone number can only contain digits";
    return null;
  },

  email: (value) => {
    if (!value?.trim()) return "Email address is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    if (value.length > 100) return "Email address is too long";
    return null;
  },

  state: (value) => {
    if (!value?.trim()) return "Province is required";
    if (value.length < 2) return "Province name is too short";
    if (value.length > 50) return "Province name is too long";
    return null;
  },

  city: (value) => {
    if (!value?.trim()) return "District/City is required";
    if (value.length < 2) return "City name is too short";
    if (value.length > 50) return "City name is too long";
    return null;
  },

  category: (value) => {
    if (!value) return "Service category is required";
    return null;
  },

  appointmentDate: (value) => {
    if (!value) return "Appointment date is required";
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) return "Appointment date cannot be in the past";
    
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() + 1);
    if (selectedDate > maxDate) return "Appointment date cannot be more than 1 year in the future";
    
    return null;
  },

  appointmentTime: (value, form) => {
    if (!value) return "Appointment time is required";
    
    if (form.timeMode === "exact") {
      const [hours, minutes] = value.split(':').map(Number);
      if (hours < 6 || (hours === 22 && minutes > 0) || hours > 22) {
        return "Appointments available between 6:00 AM and 10:00 PM";
      }
      
      // Check if appointment is in the past for today's date
      const today = new Date().toISOString().split('T')[0];
      if (form.appointmentDate === today) {
        const now = new Date();
        const appointmentDateTime = new Date(`${today}T${value}`);
        if (appointmentDateTime < now) return "Appointment time cannot be in the past";
      }
    }
    
    return null;
  },

  durationHours: (value) => {
    if (!value || value < 1) return "Duration must be at least 1 hour";
    if (value > 8) return "Duration cannot exceed 8 hours for a single appointment";
    return null;
  },

  notes: (value) => {
    if (value && value.length > 1000) return "Notes cannot exceed 1000 characters";
    return null;
  }
};

const getSuccessMessages = {
  name: (value) => value && value.length >= 2 ? "Name looks good!" : null,
  email: (value) => value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Valid email format" : null,
  phone: (value) => value && value.replace(/\D/g, '').length >= 8 ? "Valid phone number" : null,
  state: (value) => value && value.length >= 2 ? "Valid province name" : null,
  city: (value) => value && value.length >= 2 ? "Valid city name" : null,
  category: (value) => value ? "Service category selected" : null,
  appointmentDate: (value) => value ? "Date selected" : null,
  appointmentTime: (value, form) => value ? form.timeMode === "period" ? "Time period selected" : "Time selected" : null,
  durationHours: (value) => value ? "Duration set" : null,
};

/* ===== Utility Functions ===== */
const ensureInOptions = (list, value) => (value && !list.includes(value) ? [value, ...list] : list);

const dateOnlyToNoonISO = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m-1, d, 12, 0, 0).toISOString();
};

const formatPhoneNumber = (value) => {
  const numbers = value.replace(/\D/g, '');
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
  const [countryCode, setCountryCode] = useState("+1");

  const [form, setForm] = useState(() => ({
    name: "", phone: "", email: "", state: "", city: "",
    address: "", category: "", appointmentDate: todayStr,
    timeMode: "period", appointmentTime: "morning", durationHours: 1, notes: "",
    consultantId: "", consultantName: "",
    ...initialValues,
  }));

  useEffect(() => { 
    setForm((p) => ({ ...p, ...initialValues })); 
  }, [initialValues]);

  // Debounced validation to prevent excessive re-renders
  const debouncedValidation = useMemo(
    () => debounce(() => {
      const newErrors = {};
      const newSuccess = {};
      const newWarnings = {};

      Object.keys(validators).forEach(field => {
        if (touched[field] || form[field]) {
          const error = validators[field](form[field], field === 'phone' ? countryCode : form);
          if (error) {
            newErrors[field] = error;
          } else if (getSuccessMessages[field]) {
            const successMsg = getSuccessMessages[field](form[field], form);
            if (successMsg) newSuccess[field] = successMsg;
          }
        }
      });

      // Special warnings
      if (form.notes && form.notes.length > 800) {
        newWarnings.notes = `Approaching character limit (${form.notes.length}/1000)`;
      }

      if (form.appointmentDate === todayStr && form.timeMode === 'exact') {
        const [hours] = (form.appointmentTime || '').split(':').map(Number);
        const now = new Date().getHours();
        if (hours <= now + 1) {
          newWarnings.appointmentTime = "Short notice appointment - consultant availability may be limited";
        }
      }

      // Warning for weekend appointments
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
      
      // Format phone number in real-time
      if (key === 'phone' && value) {
        processedValue = formatPhoneNumber(value);
      }
      
      return { ...prev, [key]: processedValue };
    });
  }, []);

  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    Object.keys(validators).forEach(field => {
      const error = validators[field](form[field], field === 'phone' ? countryCode : form);
      if (error) {
        newErrors[field] = error;
      }
    });

    return newErrors;
  }, [form, countryCode]);

  const isFormValid = useMemo(() => {
    const formErrors = validateForm();
    return Object.keys(formErrors).length === 0;
  }, [validateForm]);

  const getCompletionPercentage = useCallback(() => {
    const requiredFields = ['name', 'phone', 'email', 'state', 'city', 'category', 'appointmentDate', 'appointmentTime', 'durationHours'];
    const completedFields = requiredFields.filter(field => {
      const value = form[field];
      if (!value) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      return true;
    }).length;
    
    return Math.round((completedFields / requiredFields.length) * 100);
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMsg?.(null);
    
    // Mark all fields as touched to show all errors
    const allTouched = {};
    Object.keys(validators).forEach(field => { allTouched[field] = true; });
    setTouched(allTouched);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus({ preventScroll: true });
      }
      
      return;
    }

    const payload = { 
      ...form, 
      appointmentDateISO: dateOnlyToNoonISO(form.appointmentDate),
      phone: countryCode + form.phone.replace(/\D/g, '')
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
    setTouched(prev => ({ ...prev, [field]: false }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setSuccess(prev => ({ ...prev, [field]: undefined }));
    setWarnings(prev => ({ ...prev, [field]: undefined }));
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
    setCountryCode("+1");
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-8" noValidate>
      {/* Form Status Indicator */}
      <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
        isFormValid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isFormValid ? 'bg-green-500' : 'bg-amber-500'}`}></div>
            <span className={`font-medium ${isFormValid ? 'text-green-800' : 'text-amber-800'}`}>
              {isFormValid ? 'Form is ready to submit' : 'Please complete all required fields'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {completionPercentage}% completed
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              completionPercentage === 100 ? 'bg-green-500' : 'bg-amber-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
        <h3 className="text-lg font-semibold text-emerald-800 mb-6">Personal Information</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Input 
            id="name" 
            label="Full Name" 
            required 
            value={form.name} 
            onChange={(e) => setField("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            error={errors.name}
            success={success.name}
            placeholder="Enter your full name (letters, numbers, and spaces allowed)"
          />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select 
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-24 rounded-lg border border-gray-300 px-3 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
              >
                {PHONE_CODES.map(({ code, country }) => (
                  <option key={code} value={code} title={country}>{code}</option>
                ))}
              </select>
              <div className="flex-1 relative">
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  placeholder="123-456-7890"
                  className={`w-full rounded-lg border px-4 py-3 text-base outline-none transition-all duration-300 min-h-[48px] ${
                    errors.phone ? "border-red-500 ring-2 ring-red-200 focus:ring-red-300"
                    : success.phone ? "border-green-500 ring-2 ring-green-200 focus:ring-green-300"
                    : "border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 hover:border-gray-400"
                  }`}
                />
                {form.phone && (
                  <button
                    type="button"
                    onClick={() => clearField("phone")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                    title="Clear phone number"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            {errors.phone && <p className="text-sm text-red-600 flex items-center gap-1">⚠️ {errors.phone}</p>}
            {success.phone && <p className="text-sm text-green-600 flex items-center gap-1">✓ {success.phone}</p>}
          </div>

          <Input 
            id="email" 
            label="Email Address" 
            required 
            type="email" 
            value={form.email} 
            onChange={(e) => setField("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            error={errors.email}
            success={success.email}
            placeholder="your.email@example.com"
            className="md:col-span-2"
          />
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-gradient-to-r from-lime-50 to-emerald-50 rounded-xl p-6 border border-lime-100">
        <h3 className="text-lg font-semibold text-lime-800 mb-6">Farm Location Details</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Input 
            id="state" 
            label="Province" 
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
            required 
            value={form.city} 
            onChange={(e) => setField("city", e.target.value)}
            onBlur={() => handleBlur("city")}
            error={errors.city}
            success={success.city}
            placeholder="Enter your district or city"
          />
          
          <Input 
            id="address" 
            label="Farm Address" 
            value={form.address} 
            onChange={(e) => setField("address", e.target.value)}
            onBlur={() => handleBlur("address")}
            placeholder="Full farm address with landmarks"
            className="md:col-span-2"
          />
        </div>
      </div>

      {/* Service Requirements */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-100">
        <h3 className="text-lg font-semibold text-green-800 mb-6">Service Requirements</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Select 
            id="category" 
            label="Service Category" 
            required 
            value={form.category} 
            onChange={(e) => setField("category", e.target.value)}
            onBlur={() => handleBlur("category")}
            error={errors.category}
            success={success.category}
          >
            <option value="">Select Agricultural Service</option>
            {categoryOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
          
          <Input 
            id="appointmentDate" 
            label="Preferred Date" 
            required 
            type="date"
            min={todayStr}
            max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
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
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
        <h3 className="text-lg font-semibold text-teal-800 mb-6">Time Scheduling</h3>
        <div className="space-y-6">
          <div className="flex items-center gap-8">
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="timeMode" 
                checked={form.timeMode === "period"} 
                onChange={() => {
                  setForm((p) => ({ 
                    ...p, 
                    timeMode: "period", 
                    appointmentTime: PERIOD_OPTIONS.includes(p.appointmentTime) ? p.appointmentTime : "morning" 
                  }));
                }}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-base font-medium text-teal-700">Time Period</span>
            </label>
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="timeMode" 
                checked={form.timeMode === "exact"} 
                onChange={() => {
                  setForm((p) => ({ 
                    ...p, 
                    timeMode: "exact", 
                    appointmentTime: PERIOD_OPTIONS.includes(p.appointmentTime) ? "09:00" : (p.appointmentTime || "09:00") 
                  }));
                }}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
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
                onBlur={() => handleBlur("appointmentTime")}
                error={errors.appointmentTime}
                success={success.appointmentTime}
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt[0].toUpperCase() + opt.slice(1)} ({opt === 'morning' ? '6 AM - 12 PM' : opt === 'afternoon' ? '12 PM - 6 PM' : '6 PM - 10 PM'})
                  </option>
                ))}
              </Select>
            ) : (
              <Input 
                id="appointmentTime" 
                label="Exact Time" 
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
              required 
              value={form.durationHours} 
              onChange={(e) => setField("durationHours", parseInt(e.target.value) || 1)}
              onBlur={() => handleBlur("durationHours")}
              error={errors.durationHours}
              success={success.durationHours}
            >
              {DURATION_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
        <h3 className="text-lg font-semibold text-amber-800 mb-6">Additional Information</h3>
        <div className="space-y-3">
          <label htmlFor="notes" className="block text-sm font-medium text-amber-800">
            Special Requirements & Notes (max 1000 characters)
          </label>
          <textarea 
            id="notes" 
            name="notes" 
            rows={5} 
            className={`w-full rounded-lg border px-4 py-3 text-base outline-none transition-all duration-300 bg-white/90 resize-vertical ${
              errors.notes ? "border-red-500 ring-2 ring-red-200" 
              : warnings.notes ? "border-amber-500 ring-2 ring-amber-200"
              : "border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            }`}
            value={form.notes} 
            onChange={(e) => setField("notes", e.target.value)}
            onBlur={() => handleBlur("notes")}
            maxLength={1000}
            placeholder="Please specify: crop types, farm size, equipment access, specific concerns, etc."
          />
          {errors.notes && <p className="text-sm text-red-600 flex items-center gap-1">⚠️ {errors.notes}</p>}
          {warnings.notes && <p className="text-sm text-amber-600 flex items-center gap-1">ℹ️ {warnings.notes}</p>}
          <div className={`text-sm ${
            form.notes?.length > 900 ? 'text-red-600 font-medium' : 
            form.notes?.length > 800 ? 'text-amber-600' : 'text-amber-600'
          }`}>
            {form.notes?.length || 0}/1000 characters used
          </div>
        </div>
      </div>

      {/* Hidden consultant fields */}
      <input type="hidden" value={form.consultantId} readOnly />
      <input type="hidden" value={form.consultantName} readOnly />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
        <button 
          type="submit" 
          disabled={submitting || !isFormValid}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            submitLabel
          )}
        </button>
        
        <button
          type="button"
          onClick={resetForm}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gray-200 px-6 py-4 text-base font-semibold text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-300"
        >
          ↺ Reset Form
        </button>
        
        <div className="text-sm text-gray-600 flex-1 text-center sm:text-right">
          {!isFormValid ? "Please fix all errors before submitting" : "All fields are valid ✓"}
        </div>
      </div>
    </form>
  );
}