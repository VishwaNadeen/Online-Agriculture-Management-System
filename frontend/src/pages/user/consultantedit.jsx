// src/pages/profile/ConsultantEditPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/* ---------------- utils ---------------- */
function safeParse(json) { try { return JSON.parse(json); } catch { return null; } }
function readAuth() {
  const get = (k) => localStorage.getItem(k) ?? sessionStorage.getItem(k);
  const token = get("auth_token") || get("token") || get("user_token") || get("authToken") || "";
  const cachedUser = safeParse(get("auth_user"));
  const userId = get("userId") || cachedUser?._id || "";
  return { token, userId, cachedUser };
}
const toCSV = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");
const toArr = (str) =>
  (str || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

/* ---------------- small icons ---------------- */
const ArrowLeft = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SaveIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M5 21h14a1 1 0 001-1V8.414a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0015.586 4H5a1 1 0 00-1 1v15a1 1 0 001 1z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 4v6h10" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

/* ---------------- UI primitives ---------------- */
function Fieldset({ title, children }) {
  return (
    <section className="mb-6 rounded-xl border border-emerald-100/70 bg-gradient-to-b from-white to-emerald-50/20 p-5 shadow-sm">
      <h2 className="text-base sm:text-lg font-semibold text-emerald-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  required = false,
  placeholder,
  step,
  readOnly = false,
  disabled = false,
  ...rest
}) {
  return (
    <label className={"block " + className}>
      <span className="block text-sm font-medium text-emerald-900 mb-1">
        {label}{required && <span className="text-red-600"> *</span>}
      </span>
      <input
        type={type}
        step={step}
        value={value ?? ""}
        onChange={(e) => !disabled && !readOnly && onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        disabled={disabled}
        className={
          "w-full rounded-lg border px-3 py-2 focus:outline-none " +
          (disabled || readOnly
            ? "bg-gray-100 text-gray-500 border-gray-300"
            : "border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500")
        }
        {...rest}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  className = "",
  required = false,
  placeholder,
  rows = 4,
  readOnly = false,
  disabled = false,
  ...rest
}) {
  return (
    <label className={"block " + className}>
      <span className="block text-sm font-medium text-emerald-900 mb-1">
        {label}{required && <span className="text-red-600"> *</span>}
      </span>
      <textarea
        rows={rows}
        value={value ?? ""}
        onChange={(e) => !disabled && !readOnly && onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        disabled={disabled}
        className={
          "w-full rounded-lg border px-3 py-2 focus:outline-none " +
          (disabled || readOnly
            ? "bg-gray-100 text-gray-500 border-gray-300"
            : "border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500")
        }
        {...rest}
      />
    </label>
  );
}

/* ---------------- page ---------------- */
export default function ConsultantEditPage() {
  const navigate = useNavigate();
  const [{ token, userId, cachedUser }, setAuth] = useState(() => readAuth());
  const [user, setUser] = useState(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // form state
  const [form, setForm] = useState({
    primarySpecialization: "",
    secondaryExpertise: "",
    yearsOfExperience: "",
    highestQualification: "",
    certifications: "",
    organizationName: "",
    consultationTypes: "",
    feeStructure: "",
    availableServices: "",
    serviceRegions: "",
    coverageRadiusKm: "",
    availableDays: "",
    availableTimeSlots: "",
    noticePeriod: "",
    languages: "",
    bio: "",
    socialLinks: "",
  });

  useEffect(() => {
    if (!token || !userId) navigate("/login");
  }, [token, userId, navigate]);

  // load user
  useEffect(() => {
    let abort = false;
    async function fetchUser() {
      if (!userId) return;
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${BASE}/users/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
        const data = await res.json();
        if (abort) return;
        setUser(data);
        // prime form from consultant object
        const c = data.consultant || {};
        setForm({
          primarySpecialization: c.primarySpecialization || "",
          secondaryExpertise: toCSV(c.secondaryExpertise),
          yearsOfExperience: c.yearsOfExperience ?? "",
          highestQualification: c.highestQualification || "",
          certifications: toCSV(c.certifications),
          organizationName: c.organizationName || "",
          consultationTypes: toCSV(c.consultationTypes),
          feeStructure: c.feeStructure || "",
          availableServices: toCSV(c.availableServices),
          serviceRegions: toCSV(c.serviceRegions),
          coverageRadiusKm: c.coverageRadiusKm ?? "",
          availableDays: toCSV(c.availableDays),
          availableTimeSlots: toCSV(c.availableTimeSlots),
          noticePeriod: c.noticePeriod || "",
          languages: toCSV(c.languages),
          bio: c.bio || "",
          socialLinks: toCSV(c.socialLinks),
        });
        const raw = JSON.stringify(data);
        localStorage.setItem("auth_user", raw);
        sessionStorage.setItem("auth_user", raw);
        window.dispatchEvent(new Event("auth-changed"));
      } catch (e) {
        if (!abort) setErr(e.message || "Failed to load profile");
      } finally {
        if (!abort) setLoading(false);
      }
    }
    fetchUser();
    return () => { abort = true; };
  }, [userId, token]);

  useEffect(() => {
    const onAuthChanged = () => setAuth(readAuth());
    window.addEventListener("auth-changed", onAuthChanged);
    window.addEventListener("storage", onAuthChanged);
    return () => {
      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("storage", onAuthChanged);
    };
  }, []);

  // IMPORTANT: this expects a *value*, not an event
  const setField = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!user?._id || !token) return;

    // minimal required validation
    if (!form.primarySpecialization.trim()) {
      toast.error("Primary Specialization is required.");
      return;
    }
    if (form.yearsOfExperience !== "" && Number(form.yearsOfExperience) < 0) {
      toast.error("Years of experience cannot be negative.");
      return;
    }
    if (form.coverageRadiusKm !== "" && Number(form.coverageRadiusKm) < 0) {
      toast.error("Coverage radius cannot be negative.");
      return;
    }

    const payload = {
      consultant: {
        primarySpecialization: form.primarySpecialization.trim(),
        secondaryExpertise: toArr(form.secondaryExpertise),
        yearsOfExperience:
          form.yearsOfExperience === "" ? undefined : Number(form.yearsOfExperience),
        highestQualification: form.highestQualification.trim() || undefined,
        certifications: toArr(form.certifications),
        organizationName: form.organizationName.trim() || undefined,
        consultationTypes: toArr(form.consultationTypes),
        feeStructure: form.feeStructure.trim() || undefined,
        availableServices: toArr(form.availableServices),
        serviceRegions: toArr(form.serviceRegions),
        coverageRadiusKm:
          form.coverageRadiusKm === "" ? undefined : Number(form.coverageRadiusKm),
        availableDays: toArr(form.availableDays),
        availableTimeSlots: toArr(form.availableTimeSlots),
        noticePeriod: form.noticePeriod.trim() || undefined,
        languages: toArr(form.languages),
        bio: form.bio,
        socialLinks: toArr(form.socialLinks),
      },
    };

    try {
      setSaving(true);
      const res = await fetch(`${BASE}/users/${user._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = "";
        try { const j = await res.json(); msg = j?.message || j?.error || ""; } catch {}
        throw new Error(msg || `Update failed (${res.status})`);
      }
      const updated = await res.json();
      localStorage.setItem("auth_user", JSON.stringify(updated));
      sessionStorage.setItem("auth_user", JSON.stringify(updated));
      window.dispatchEvent(new Event("auth-changed"));

      toast.success("Consultant profile updated");
      navigate("/profile/consultant");
    } catch (e) {
      toast.error(e.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = useMemo(
    () =>
      cachedUser?.profilePicture ||
      `https://ui-avatars.com/api/?background=E6F4EA&color=166534&name=${
        encodeURIComponent(
          `${cachedUser?.firstName || ""} ${cachedUser?.lastName || ""}`.trim() || "User"
        )
      }`,
    [cachedUser]
  );

  const fullName = useMemo(
    () => `${cachedUser?.firstName || ""} ${cachedUser?.lastName || ""}`.trim() || "User",
    [cachedUser?.firstName, cachedUser?.lastName]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-emerald-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="relative bg-white border border-emerald-100 shadow-xl rounded-2xl overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500" />

          {/* Centered avatar + name */}
          <div className="px-6 -mt-14 flex flex-col items-center text-center">
            <img
              src={avatarSrc}
              alt="Avatar"
              className="w-28 h-28 rounded-full ring-4 ring-white object-cover shadow-lg"
            />
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-emerald-900">{fullName}</h1>
            {err ? <p className="text-sm text-red-600 mt-1">{err}</p> : null}
          </div>

          <form onSubmit={submit} className="px-6 pb-6 pt-4">
            <Fieldset title="Overview">
              <div className="grid grid-cols-1 gap-y-6">
                <TextInput
                  label="Primary Specialization"
                  value={form.primarySpecialization}
                  onChange={setField("primarySpecialization")}
                  placeholder="e.g., Plant Pathology"
                  required
                />
                <TextArea
                  label="Bio"
                  value={form.bio}
                  onChange={setField("bio")}
                  placeholder="Short introduction, achievements, interests..."
                  rows={4}
                />
              </div>
            </Fieldset>

            <Fieldset title="Expertise & Experience">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <TextInput
                  label="Secondary Expertise (comma separated)"
                  value={form.secondaryExpertise}
                  onChange={setField("secondaryExpertise")}
                  placeholder="e.g., Soil Health, IPM"
                />
                <TextInput
                  label="Years of Experience"
                  type="number"
                  value={form.yearsOfExperience}
                  onChange={setField("yearsOfExperience")}
                  placeholder="e.g., 5"
                  min="0"
                />
                <TextInput
                  label="Highest Qualification"
                  value={form.highestQualification}
                  onChange={setField("highestQualification")}
                  placeholder="e.g., MSc Agronomy"
                />
                <TextInput
                  label="Certifications (comma separated)"
                  value={form.certifications}
                  onChange={setField("certifications")}
                  placeholder="e.g., IPM Certified, GAP"
                />
                <TextInput
                  label="Organization"
                  value={form.organizationName}
                  onChange={setField("organizationName")}
                  placeholder="Company/Institution name"
                />
              </div>
            </Fieldset>

            <Fieldset title="Services & Fees">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <TextInput
                  label="Consultation Types (comma separated)"
                  value={form.consultationTypes}
                  onChange={setField("consultationTypes")}
                  placeholder="Online, On-site"
                />
                <TextInput
                  label="Available Services (comma separated)"
                  value={form.availableServices}
                  onChange={setField("availableServices")}
                  placeholder="Soil testing, Pest diagnosis"
                />
                <TextInput
                  label="Fee Structure"
                  value={form.feeStructure}
                  onChange={setField("feeStructure")}
                  placeholder="e.g., LKR 2000/hour, first 15 mins free"
                />
              </div>
            </Fieldset>

            <Fieldset title="Coverage & Availability">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <TextInput
                  label="Service Regions (comma separated)"
                  value={form.serviceRegions}
                  onChange={setField("serviceRegions")}
                  placeholder="Western, Southern"
                />
                <TextInput
                  label="Coverage Radius (km)"
                  type="number"
                  value={form.coverageRadiusKm}
                  onChange={setField("coverageRadiusKm")}
                  placeholder="e.g., 50"
                  min="0"
                  step="1"
                />
                <TextInput
                  label="Available Days (comma separated)"
                  value={form.availableDays}
                  onChange={setField("availableDays")}
                  placeholder="Mon, Wed, Fri"
                />
                <TextInput
                  label="Available Time Slots (comma separated)"
                  value={form.availableTimeSlots}
                  onChange={setField("availableTimeSlots")}
                  placeholder="09:00-11:00, 14:00-16:00"
                />
                <TextInput
                  label="Notice Period"
                  value={form.noticePeriod}
                  onChange={setField("noticePeriod")}
                  placeholder="24 hours"
                />
              </div>
            </Fieldset>

            <Fieldset title="Languages & Links">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <TextInput
                  label="Languages (comma separated)"
                  value={form.languages}
                  onChange={setField("languages")}
                  placeholder="Sinhala, English"
                />
                <TextInput
                  label="Social Links (comma separated URLs)"
                  value={form.socialLinks}
                  onChange={setField("socialLinks")}
                  placeholder="https://linkedin.com/in/..., https://twitter.com/..."
                />
              </div>
            </Fieldset>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate("/profile/consultant")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-5 h-5" /> Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                ) : (
                  <SaveIcon className="w-5 h-5" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
