// src/pages/UserRegistration.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { User, Mail, Phone, Lock, MapPin, Calendar, Upload, Leaf } from "lucide-react";
import RoleSelectModal from "../../components/roleSelect.jsx";

const UPLOAD_URL = "http://localhost:4000/uploads/profile";

const FALLBACK_CODES = [
  { name: "Sri Lanka", dial_code: "+94", code: "LK" },
  { name: "India", dial_code: "+91", code: "IN" },
  { name: "United States/Canada", dial_code: "+1", code: "US" },
  { name: "United Kingdom", dial_code: "+44", code: "GB" },
  { name: "Australia", dial_code: "+61", code: "AU" },
];

const cls = (...arr) => arr.filter(Boolean).join(" ");

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function UserRegistration() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    profilePicture: "",
    password: "",
    address: {
      country: "",
      stateProvince: "",
      city: "",
      postalCode: "",
      line1: "",
      line2: "",
    },
    role: "user",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [codes, setCodes] = useState([]);
  const [countryCode, setCountryCode] = useState("+94");
  const [query, setQuery] = useState("+94");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const comboRef = useRef(null);

  const [phoneLocal, setPhoneLocal] = useState("");
  const [errors, setErrors] = useState({
    phone: "",
    email: "",
    dob: "",
    password: "",
    confirmPassword: "",
    postalCode: "",
  });

  const [chooseRoleOpen, setChooseRoleOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/dial-codes.json");
        if (Array.isArray(res.data) && res.data.length) {
          setCodes(res.data);
          return;
        }
      } catch {
        // fall back
      }
      setCodes(FALLBACK_CODES);
    })();
  }, []);

  useEffect(() => {
    if (!codes.length) return;
    if (!codes.some((c) => c.dial_code === countryCode)) {
      setCountryCode(codes[0].dial_code);
      setQuery(codes[0].dial_code);
    }
  }, [codes]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredCodes = useMemo(() => {
    if (!query) return codes;
    const q = query.toLowerCase();
    const startsWithPlus = /^\+\d+$/.test(q);
    let list = codes.filter((c) => {
      const name = c.name.toLowerCase();
      const dial = c.dial_code.toLowerCase();
      if (startsWithPlus) return dial.startsWith(q);
      return name.includes(q) || dial.includes(q);
    });
    const exact = list.findIndex((c) => c.dial_code.toLowerCase() === q);
    if (exact > 0) {
      const [item] = list.splice(exact, 1);
      list.unshift(item);
    }
    return list;
  }, [codes, query]);

  useEffect(() => setHighlightIndex(0), [query]);

  const selectCode = (item) => {
    setCountryCode(item.dial_code);
    setQuery(item.dial_code);
    setIsOpen(false);
    document.getElementById("phone-local-input")?.focus();
  };

  const onComboKeyDown = (e) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filteredCodes.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = filteredCodes[highlightIndex] || filteredCodes[0];
      if (pick) selectCode(pick);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (comboRef.current && !comboRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const validatePhone = (val) => {
    if (!val) return "Phone is required";
    if (!/^\d+$/.test(val)) return "Only digits allowed";
    if (val.length !== 10) return "Phone must be exactly 10 digits";
    return "";
  };
  const validatePostalCode = (val) => {
    if (!val) return "Postal code is required";
    if (!/^\d+$/.test(val)) return "Postal code must contain only numbers";
    return "";
  };
  const validateEmail = (val) => {
    if (!val) return "Email is required";
    const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (!re.test(val)) return "Enter a valid email (e.g., name@example.com)";
    return "";
  };
  const validateDOB = (val) => {
    if (!val) return "Date of birth is required";
    const today = new Date(todayISO());
    const dob = new Date(val);
    if (dob > today) return "Date of birth cannot be in the future";
    return "";
  };
  const validatePassword = (val) => {
    if (!val) return "Password is required";
    if (val.length < 6) return "Password must be at least 6 characters";
    return "";
  };
  const validateConfirmPassword = (pwd, confirm) => {
    if (!confirm) return "Please confirm your password";
    if (pwd !== confirm) return "Passwords do not match";
    return "";
  };

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneLocal(digits);
    setErrors((p) => ({ ...p, phone: validatePhone(digits) }));
  };
  const handleEmailChange = (e) => {
    const value = e.target.value.trim();
    setForm((f) => ({ ...f, email: value }));
    setErrors((p) => ({ ...p, email: validateEmail(value) }));
  };
  const handlePostalCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove all non-digit characters
    setForm((f) => ({ ...f, address: { ...f.address, postalCode: value } }));
    setErrors((p) => ({ ...p, postalCode: validatePostalCode(value) }));
  };
  const handleDOBChange = (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, dateOfBirth: value }));
    setErrors((p) => ({ ...p, dob: validateDOB(value) }));
  };
  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setForm((f) => ({ ...f, password: pwd }));
    setErrors((p) => ({
      ...p,
      password: validatePassword(pwd),
      confirmPassword: validateConfirmPassword(pwd, confirmPassword),
    }));
  };
  const handleConfirmPasswordChange = (e) => {
    const confirm = e.target.value;
    setConfirmPassword(confirm);
    setErrors((p) => ({
      ...p,
      confirmPassword: validateConfirmPassword(form.password, confirm),
    }));
  };

  const [preview, setPreview] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const handleProfileFile = (e) => {
    const file = e.target.files?.[0];
    setUploadError("");
    if (!file) {
      setProfileFile(null);
      setPreview("");
      return;
    }
    setProfileFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const requiredFilled =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.dateOfBirth &&
    form.gender &&
    form.password &&
    form.address.country.trim() &&
    form.address.stateProvince.trim() &&
    form.address.city.trim() &&
    form.address.postalCode.trim() &&
    form.address.line1.trim();

  const noErrors =
    !errors.phone && !errors.email && !errors.dob && !errors.password && !errors.confirmPassword && !errors.postalCode;

  const phoneOk = !validatePhone(phoneLocal);
  const passwordsMatch = !validateConfirmPassword(form.password, confirmPassword);
  const canShowSubmit = Boolean(requiredFilled && noErrors && phoneOk && passwordsMatch);

  const handleReset = () => {
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      dateOfBirth: "",
      gender: "",
      profilePicture: "",
      password: "",
      address: {
        country: "",
        stateProvince: "",
        city: "",
        postalCode: "",
        line1: "",
        line2: "",
      },
      role: "user",
    });
    setConfirmPassword("");
    setPhoneLocal("");
    setErrors({
      phone: "",
      email: "",
      dob: "",
      password: "",
      confirmPassword: "",
      postalCode: "",
    });
    setPreview("");
    setProfileFile(null);
    setUploadError("");
    setQuery(countryCode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phoneErr = validatePhone(phoneLocal);
    const emailErr = validateEmail(form.email);
    const dobErr = validateDOB(form.dateOfBirth);
    const pwdErr = validatePassword(form.password);
    const cpwErr = validateConfirmPassword(form.password, confirmPassword);
    const postalCodeErr = validatePostalCode(form.address.postalCode);

    const nextErrors = { phone: phoneErr, email: emailErr, dob: dobErr, password: pwdErr, confirmPassword: cpwErr, postalCode: postalCodeErr };
    setErrors(nextErrors);
    if (phoneErr || emailErr || dobErr || pwdErr || cpwErr || postalCodeErr) return;

    setLoading(true);
    try {
      const fd = new FormData();
      if (profileFile) fd.append("profile", profileFile);
      const payload = { ...form, phone: `${countryCode}${phoneLocal}` };
      fd.append("data", JSON.stringify(payload));

      const res = await axios.post("http://localhost:4000/users/userRegistration", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const userId = res?.data?.user?._id || res?.data?.userId;
      const token = res?.data?.token;
      if (userId) localStorage.setItem("tempUserId", userId);
      if (token) {
        localStorage.setItem("auth_token", token);
        localStorage.setItem("token", token);
      }

      toast.success("Registration saved ✅");
      setChooseRoleOpen(true);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Registration failed ❌";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-emerald-50 px-4 py-12 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />
      
      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-white shadow-2xl p-8 rounded-3xl border border-emerald-100/50 max-w-3xl w-full space-y-6"
      >
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 rounded-t-3xl" />
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Leaf className="w-10 h-10 text-emerald-600" />
              <div className="absolute inset-0 bg-emerald-400 opacity-30 blur-xl" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
              User Registration
            </h2>
          </div>
          <p className="text-emerald-600">Join the Green Grow community today</p>
        </div>

        {/* Personal Information Section */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <User className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Personal Information</h3>
          </div>

          {/* First/Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group">
              <label className="block text-sm font-semibold text-emerald-800 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
              />
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-emerald-800 mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-emerald-800 mb-2">Phone</label>
            <div className="flex gap-3">
              <div className="relative w-48" ref={comboRef}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                  }}
                  onFocus={() => setIsOpen(true)}
                  onKeyDown={onComboKeyDown}
                  className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                  placeholder="+94 or country"
                />
                {isOpen && (
                  <ul className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border-2 border-emerald-200 bg-white shadow-xl">
                    {filteredCodes.length === 0 ? (
                      <li className="px-4 py-3 text-gray-500">No matches</li>
                    ) : (
                      filteredCodes.map((c, idx) => (
                        <li
                          key={`${c.code}-${c.dial_code}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectCode(c);
                          }}
                          className={cls(
                            "px-4 py-3 cursor-pointer flex justify-between text-sm transition-colors",
                            idx === highlightIndex ? "bg-emerald-50 text-emerald-700 font-medium" : "hover:bg-emerald-50/50"
                          )}
                          onMouseEnter={() => setHighlightIndex(idx)}
                        >
                          <span>{c.name}</span>
                          <span className="font-semibold">{c.dial_code}</span>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>

              <div className="flex-1">
                <input
                  id="phone-local-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="9-digit number"
                  value={phoneLocal}
                  onChange={handlePhoneChange}
                  required
                  className={cls(
                    "w-full rounded-xl border-2 bg-emerald-50/50 px-4 py-3 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all",
                    errors.phone ? "border-red-400 focus:border-red-500" : "border-emerald-200"
                  )}
                />
                {errors.phone && <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <span className="text-red-500">⚠</span> {errors.phone}
                </p>}
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="group">
            <label className="block text-sm font-semibold text-emerald-800 mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Mail className="w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
              </div>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleEmailChange}
                required
                className={cls(
                  "w-full rounded-xl border-2 bg-emerald-50/50 pl-12 pr-4 py-3 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all",
                  errors.email ? "border-red-400 focus:border-red-500" : "border-emerald-200"
                )}
              />
            </div>
            {errors.email && <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
              <span className="text-red-500">⚠</span> {errors.email}
            </p>}
          </div>

          {/* DOB & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group">
              <label className="block text-sm font-semibold text-emerald-800 mb-2">Date of Birth</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Calendar className="w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleDOBChange}
                  max={todayISO()}
                  required
                  className={cls(
                    "w-full rounded-xl border-2 bg-emerald-50/50 pl-12 pr-4 py-3 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all",
                    errors.dob ? "border-red-400 focus:border-red-500" : "border-emerald-200"
                  )}
                />
              </div>
              {errors.dob && <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.dob}
              </p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-emerald-800 mb-2">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                required
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
              >
                <option value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Password + Confirm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group">
              <label className="block text-sm font-semibold text-emerald-800 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Lock className="w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handlePasswordChange}
                  required
                  className={cls(
                    "w-full rounded-xl border-2 bg-emerald-50/50 pl-12 pr-4 py-3 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all",
                    errors.password ? "border-red-400 focus:border-red-500" : "border-emerald-200"
                  )}
                />
              </div>
              {errors.password && <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.password}
              </p>}
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-emerald-800 mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Lock className="w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  required
                  className={cls(
                    "w-full rounded-xl border-2 bg-emerald-50/50 pl-12 pr-4 py-3 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all",
                    errors.confirmPassword ? "border-red-400 focus:border-red-500" : "border-emerald-200"
                  )}
                />
              </div>
              {errors.confirmPassword && <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {errors.confirmPassword}
              </p>}
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="space-y-5 pt-6">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Address Information</h3>
          </div>

          <div>
            <label className="block text-sm font-semibold text-emerald-800 mb-2">Country</label>
            <input
              type="text"
              name="address.country"
              placeholder="Country"
              value={form.address.country}
              onChange={(e) =>
                setForm({ ...form, address: { ...form.address, country: e.target.value } })
              }
              required className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-emerald-800 mb-2">State / Province</label>
              <input
                type="text"
                name="address.stateProvince"
                placeholder="State / Province"
                value={form.address.stateProvince}
                onChange={(e) =>
                  setForm({ ...form, address: { ...form.address, stateProvince: e.target.value } })
                }
                required
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-emerald-800 mb-2">City</label>
              <input
                type="text"
                name="address.city"
                placeholder="City"
                value={form.address.city}
                onChange={(e) =>
                  setForm({ ...form, address: { ...form.address, city: e.target.value } })
                }
                required
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"

              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-emerald-800 mb-2">Postal Code</label>
              <input
                type="text"
                name="address.postalCode"
                placeholder="Postal Code"
                value={form.address.postalCode}
                onChange={handlePostalCodeChange}
                required
                className={`w-full rounded-xl border-2 px-4 py-3 focus:outline-none focus:border-[3px] transition-all ${
                  errors.postalCode
                    ? "border-red-300 bg-red-50/50 focus:border-red-500"
                    : "border-emerald-200 bg-emerald-50/50 focus:border-emerald-600"
                }`}
              />
              {errors.postalCode && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.791-.835 2.791-1.87V8.87c0-1.035-1.251-1.87-2.791-1.87H5.062c-1.54 0-2.791.835-2.791 1.87v8.26c0 1.035 1.251 1.87 2.791 1.87z" />
                  </svg>
                  {errors.postalCode}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-emerald-800 mb-2">Address Line 1</label>
              <input
                type="text"
                name="address.line1"
                placeholder="Street address"
                value={form.address.line1}
                onChange={(e) =>
                  setForm({ ...form, address: { ...form.address, line1: e.target.value } })
                }
                required
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"

              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-emerald-800 mb-2">Address Line 2 (optional)</label>
            <input
              type="text"
              name="address.line2"
              placeholder="Apartment, suite, etc."
              value={form.address.line2}
              onChange={(e) =>
                setForm({ ...form, address: { ...form.address, line2: e.target.value } })
              }
              className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"

            />
          </div>
        </div>

        {/* Profile Picture */}
        <div className="space-y-5 pt-6">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <Upload className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Profile Picture</h3>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full border-4 border-emerald-200 overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center shadow-lg group">
              {preview ? (
                <>
                  <img src={preview} alt="Profile preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </>
              ) : (
                <Upload className="w-8 h-8 text-emerald-300" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileFile}
                className="block w-full text-sm text-emerald-700
                           file:mr-4 file:py-3 file:px-6
                           file:rounded-xl file:border-0
                           file:text-sm file:font-semibold
                           file:bg-emerald-100 file:text-emerald-700
                           hover:file:bg-emerald-200 file:transition-colors file:cursor-pointer
                           cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-2">
                Choose an image (JPG/PNG). Maximum 5MB. It will upload with your details.
              </p>
              {uploading && <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading…
              </p>}
              {uploadError && <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <span className="text-red-500">⚠</span> {uploadError}
              </p>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
          <button
            type="button"
            onClick={handleReset}
            className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-700 font-semibold shadow hover:bg-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 border-gray-200"
          >
            Reset
          </button>

          {canShowSubmit ? (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] transform"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Next
                  <span className="text-lg">→</span>
                </span>
              )}
            </button>
          ) : (
            <div className="w-full py-3.5 rounded-xl bg-gray-200 text-gray-400 text-center select-none font-semibold border-2 border-gray-300 cursor-not-allowed">
              Next
            </div>
          )}
        </div>
      </form>

      <RoleSelectModal open={chooseRoleOpen} onClose={() => setChooseRoleOpen(false)} />
    </div>
  );
}
