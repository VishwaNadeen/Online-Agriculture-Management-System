// src/pages/UserRegistration.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// If your backend upload endpoint differs, change this:
const UPLOAD_URL = "http://localhost:4000/uploads/profile"; // (kept but not used now, per requirement)

// Last-resort fallback if local file missing
const FALLBACK_CODES = [
  { name: "Sri Lanka", dial_code: "+94", code: "LK" },
  { name: "India", dial_code: "+91", code: "IN" },
  { name: "United States/Canada", dial_code: "+1", code: "US" },
  { name: "United Kingdom", dial_code: "+44", code: "GB" },
  { name: "Australia", dial_code: "+61", code: "AU" },
];

const cls = (...arr) => arr.filter(Boolean).join(" ");

// helper: YYYY-MM-DD for <input type="date" max=...>
const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function UserRegistration() {
  const navigate = useNavigate();

  // ---- form state ----
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    profilePicture: "", // will be URL after upload OR user-typed url (kept in state, but we won't use paste URL anymore)
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

  // CHANGED: these two kept but not used for auto-upload now (requirement says do not auto upload)
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // ---- country codes ----
  const [codes, setCodes] = useState([]);
  const [countryCode, setCountryCode] = useState("+94"); // default
  const [query, setQuery] = useState("+94"); // shown in combobox
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const comboRef = useRef(null);

  // ---- phone / email / dob / password ----
  const [phoneLocal, setPhoneLocal] = useState("");
  const [errors, setErrors] = useState({
    phone: "",
    email: "",
    dob: "",
    password: "",
    confirmPassword: "",
  });

  // load from local /public/dial-codes.json
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/dial-codes.json");
        if (Array.isArray(res.data) && res.data.length) {
          setCodes(res.data);
          return;
        }
      } catch (err) {
        console.error("Could not load local dial codes", err);
      }
      setCodes(FALLBACK_CODES);
    })();
  }, []);

  // keep selection valid
  useEffect(() => {
    if (!codes.length) return;
    if (!codes.some((c) => c.dial_code === countryCode)) {
      setCountryCode(codes[0].dial_code);
      setQuery(codes[0].dial_code);
    }
  }, [codes]); // eslint-disable-line react-hooks/exhaustive-deps

  // filter codes based on query
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

  // click outside closes dropdown
  useEffect(() => {
    const handler = (e) => {
      if (comboRef.current && !comboRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  // ---- validations ----
  const validatePhone = (val) => {
    if (!val) return "Phone is required";
    if (!/^\d+$/.test(val)) return "Only digits allowed";
    if (val.length !== 9) return "Phone must be exactly 9 digits";
    return "";
  };

  const validateEmail = (val) => {
    if (!val) return "Email is required";
    // pragmatic email regex (user@domain.tld)
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

  // --- handlers for fields with validation ---
  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
    setPhoneLocal(digits);
    setErrors((p) => ({ ...p, phone: validatePhone(digits) }));
  };

  const handleEmailChange = (e) => {
    const value = e.target.value.trim();
    setForm((f) => ({ ...f, email: value }));
    setErrors((p) => ({ ...p, email: validateEmail(value) }));
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

  // ---- profile picture: choose & preview only (NO AUTO UPLOAD) ----
  const [preview, setPreview] = useState("");
  const [profileFile, setProfileFile] = useState(null); // CHANGED: keep the file for submit time

  const handleProfileFile = async (e) => {
    const file = e.target.files?.[0];
    setUploadError("");
    if (!file) {
      setProfileFile(null);
      setPreview("");
      return;
    }
    setProfileFile(file);
    setPreview(URL.createObjectURL(file));
    // CHANGED: Do NOT upload here. Only preview.
  };

  // ---- required fields filled? ----
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

  // no validation errors?
  const noErrors =
    !errors.phone &&
    !errors.email &&
    !errors.dob &&
    !errors.password &&
    !errors.confirmPassword;

  // phone ok?
  const phoneOk = !validatePhone(phoneLocal);

  // password match?
  const passwordsMatch = !validateConfirmPassword(form.password, confirmPassword);

  // final gate for showing button
  const canShowSubmit = Boolean(requiredFilled && noErrors && phoneOk && passwordsMatch);

  // CHANGED: handleReset clears everything, including preview/file
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
    });
    setPreview("");
    setProfileFile(null);
    setUploadError("");
    setQuery(countryCode); // keep current code visible
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // final validations
    const phoneErr = validatePhone(phoneLocal);
    const emailErr = validateEmail(form.email);
    const dobErr = validateDOB(form.dateOfBirth);
    const pwdErr = validatePassword(form.password);
    const cpwErr = validateConfirmPassword(form.password, confirmPassword);

    const nextErrors = {
      phone: phoneErr,
      email: emailErr,
      dob: dobErr,
      password: pwdErr,
      confirmPassword: cpwErr,
    };
    setErrors(nextErrors);

    if (phoneErr || emailErr || dobErr || pwdErr || cpwErr) return;

    setLoading(true);
    try {
      // CHANGED: Submit everything as multipart/form-data in ONE request
      const fd = new FormData();

      // append the profile image file if chosen
      if (profileFile) {
        fd.append("profile", profileFile); // field name "profile" (adjust to your backend)
      }

      // compose payload with phone including country code
      const payload = { ...form, phone: `${countryCode}${phoneLocal}` };

      // we send the rest as a JSON string under "data"
      fd.append("data", JSON.stringify(payload));

      const res = await axios.post(
        "http://localhost:4000/users/userRegistration",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      localStorage.setItem("tempUserId", res.data.userId);
      alert("Registration saved ✅");
      navigate("/register-step2");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Registration failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-emerald-100 max-w-2xl w-full space-y-5"
      >
        <h2 className="text-3xl font-bold text-emerald-700 text-center">
          User Registration
        </h2>

        {/* First/Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
              className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
              className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <div className="flex gap-2">
            {/* Combobox */}
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
                className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                placeholder="+94 or type country"
              />
              {isOpen && (
                <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-white shadow">
                  {filteredCodes.length === 0 ? (
                    <li className="px-3 py-2 text-gray-500">No matches</li>
                  ) : (
                    filteredCodes.map((c, idx) => (
                      <li
                        key={`${c.code}-${c.dial_code}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectCode(c);
                        }}
                        className={cls(
                          "px-3 py-2 cursor-pointer flex justify-between text-sm",
                          idx === highlightIndex
                            ? "bg-emerald-50 text-emerald-700"
                            : "hover:bg-gray-50"
                        )}
                        onMouseEnter={() => setHighlightIndex(idx)}
                      >
                        <span>{c.name}</span>
                        <span className="font-medium">{c.dial_code}</span>
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
                  "w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-emerald-500",
                  errors.phone ? "border-red-500" : ""
                )}
              />
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleEmailChange}
            required
            className={cls(
              "w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-emerald-500",
              errors.email ? "border-red-500" : ""
            )}
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* DOB & Gender */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleDOBChange}
              max={todayISO()}             // cannot select future dates
              required
              className={cls(
                "w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-emerald-500",
                errors.dob ? "border-red-500" : ""
              )}
            />
            {errors.dob && (
              <p className="text-red-600 text-sm mt-1">{errors.dob}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              required
              className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handlePasswordChange}
              required
              className={cls(
                "w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-emerald-500",
                errors.password ? "border-red-500" : ""
              )}
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
              className={cls(
                "w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-emerald-500",
                errors.confirmPassword ? "border-red-500" : ""
              )}
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <input
            type="text"
            name="address.country"
            placeholder="Country"
            value={form.address.country}
            onChange={(e) =>
              setForm({ ...form, address: { ...form.address, country: e.target.value } })
            }
            required
            className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
            <input
              type="text"
              name="address.stateProvince"
              placeholder="State / Province"
              value={form.address.stateProvince}
              onChange={(e) =>
                setForm({
                  ...form,
                  address: { ...form.address, stateProvince: e.target.value },
                })
              }
              required
              className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              name="address.city"
              placeholder="City"
              value={form.address.city}
              onChange={(e) =>
                setForm({ ...form, address: { ...form.address, city: e.target.value } })
              }
              required
              className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
            <input
              type="text"
              name="address.postalCode"
              placeholder="Postal Code"
              value={form.address.postalCode}
              onChange={(e) =>
                setForm({
                  ...form,
                  address: { ...form.address, postalCode: e.target.value },
                })
              }
              required
              className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
            <input
              type="text"
              name="address.line1"
              placeholder="Street address"
              value={form.address.line1}
              onChange={(e) =>
                setForm({ ...form, address: { ...form.address, line1: e.target.value } })
              }
              required
              className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (optional)</label>
          <input
            type="text"
            name="address.line2"
            placeholder="Apartment, suite, etc."
            value={form.address.line2}
            onChange={(e) =>
              setForm({ ...form, address: { ...form.address, line2: e.target.value } })
            }
            className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border overflow-hidden bg-gray-100 flex items-center justify-center">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-400">No image</span>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileFile}
                className="block w-full text-sm text-gray-700
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-lg file:border-0
                           file:text-sm file:font-semibold
                           file:bg-emerald-50 file:text-emerald-700
                           hover:file:bg-emerald-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Choose an image to upload (JPG/PNG). It will show a preview and upload when you click Next.
              </p>
              {uploading && <p className="text-xs text-emerald-700 mt-1">Uploading…</p>}
              {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
              {/* CHANGED: Removed the "paste image URL" input per requirement */}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold shadow hover:bg-gray-200 transition"
          >
            Reset
          </button>

          {canShowSubmit ? (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 disabled:bg-gray-400 transition"
            >
              {loading ? "Saving..." : "Next →"}
            </button>
          ) : (
            <div className="w-full py-3 rounded-xl bg-gray-200 text-gray-500 text-center select-none">
              Next
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
