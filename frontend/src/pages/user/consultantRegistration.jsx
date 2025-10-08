import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Briefcase, User, Calendar, Globe, MessageSquare, Leaf } from "lucide-react";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/* ---------------- small ui helpers ---------------- */
const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-emerald-800">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const Select = ({ value, onChange, options, placeholder = "Select...", disabled }) => (
  <select
    className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
  >
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
);

const MultiSelect = ({ value = [], onChange, options, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (val) => {
    const newValue = value.includes(val)
      ? value.filter((v) => v !== val)
      : [...value, val];
    onChange(newValue);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-left text-sm text-emerald-900 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
      >
        {value.length > 0 ? (
          <span>{value.join(", ")}</span>
        ) : (
          <span className="text-emerald-400">{placeholder}</span>
        )}
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-2 w-full rounded-xl border-2 border-emerald-200 bg-white shadow-xl max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center px-4 py-3 hover:bg-emerald-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={value.includes(opt)}
                onChange={() => toggleOption(opt)}
                className="mr-3 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------- data dictionaries ---------------- */
const CONSULTATION_TYPES = [
  "On-site Visit",
  "Remote Call",
  "Soil Testing",
  "Irrigation Design",
  "Training/Workshops",
  "Other",
];
const AVAILABLE_SERVICES = [
  "Soil Analysis",
  "Water Testing",
  "Nutrient Planning",
  "Pest & Disease Diagnosis",
  "Yield Optimization",
  "Other",
];
const SERVICE_REGIONS = ["Local", "District-wide", "Province-wide", "Nationwide", "International"];
const AVAILABLE_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00"];
const FEE_STRUCTURES = ["Hourly", "Per Visit", "Negotiable", "Retainer", "Other"];
const NOTICE_PERIODS = ["No notice", "24 hours", "48 hours", "1 week", "2 weeks", "Other"];
const LANGUAGES = ["English", "Sinhala", "Tamil"];

/* ---------------- auth helpers ---------------- */
const getToken = () =>
  localStorage.getItem("auth_token") ||
  localStorage.getItem("token") ||
  localStorage.getItem("user_token") ||
  localStorage.getItem("authToken") ||
  "";

/* ---------------- page ---------------- */
export default function ConsultantRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  useEffect(() => {
    const id = localStorage.getItem("tempUserId");
    if (!id) {
      toast.error("Please complete User Registration first.");
      navigate("/userRegistration");
    }
  }, [navigate]);

  const [consultant, setConsultant] = useState({
    primarySpecialization: "",
    secondaryExpertise: [],
    yearsOfExperience: "",
    highestQualification: "",
    certifications: [],
    organizationName: "",
    consultationTypes: [],
    feeStructure: "",
    availableServices: [],
    serviceRegions: [],
    coverageRadiusKm: "",
    availableDays: [],
    availableTimeSlots: [],
    noticePeriod: "",
    languages: [],
    bio: "",
    socialLinks: [],
  });

  const [social, setSocial] = useState({
    facebook: "",
    instagram: "",
    linkedin: "",
  });

  const canSubmit = useMemo(() => {
    return Boolean(
      consultant.primarySpecialization &&
      consultant.yearsOfExperience &&
      consultant.highestQualification
    );
  }, [consultant]);

  const normSocialLinks = () => {
    const out = [];
    const { facebook, instagram, linkedin } = social;
    if (facebook) {
      const f = facebook.startsWith("http")
        ? facebook
        : `https://www.facebook.com/${facebook.replace(/^@/, "")}`;
      out.push(f);
    }
    if (instagram) {
      const i = instagram.startsWith("http")
        ? instagram
        : `https://www.instagram.com/${instagram.replace(/^@/, "")}`;
      out.push(i);
    }
    if (linkedin) {
      const l = linkedin.startsWith("http")
        ? linkedin
        : `https://www.linkedin.com/in/${linkedin.replace(/^@/, "")}`;
      out.push(l);
    }
    return out;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!canSubmit) return;

    const userId = localStorage.getItem("tempUserId");
    if (!userId) {
      toast.error("Missing user id. Please register again.");
      navigate("/userRegistration");
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error("You must be logged in to save details.");
      return;
    }

    const payload = {
      role: "consultant",
      consultant: {
        ...consultant,
        yearsOfExperience: consultant.yearsOfExperience ? Number(consultant.yearsOfExperience) : undefined,
        coverageRadiusKm: consultant.coverageRadiusKm ? Number(consultant.coverageRadiusKm) : undefined,
        socialLinks: normSocialLinks(),
      },
    };

    setLoading(true);
    try {
      const response = await axios.patch(`${BASE}/users/${userId}`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Update the stored user data
      const updatedUser = response.data;
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      sessionStorage.setItem("auth_user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("auth-changed"));
      
      toast.success("Consultant details saved ✅");
      navigate("/");
    } catch (error) {
      console.error("Consultant registration error:", error);
      const msg =
        error.response?.data?.message || error.message || "Failed to save details";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex items-start justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />
      
      <form
        onSubmit={handleSubmit}
        className={`relative z-10 w-full max-w-4xl bg-white shadow-2xl rounded-3xl border border-emerald-100/50 p-8 space-y-8 transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 rounded-t-3xl" />
        
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Briefcase className="w-10 h-10 text-emerald-600" />
              <div className="absolute inset-0 bg-emerald-400 opacity-30 blur-xl" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
              Consultant Registration
            </h2>
          </div>
          <p className="text-emerald-600">Complete your consultant profile</p>
        </div>

        {/* Personal Information */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <User className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Personal Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Primary Specialization" required>
              <input
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                value={consultant.primarySpecialization}
                onChange={(e) =>
                  setConsultant({ ...consultant, primarySpecialization: e.target.value })
                }
                placeholder="e.g., Soil Science"
                required
              />
            </Field>
            <Field label="Years of Experience" required>
              <input
                type="number"
                min="0"
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                value={consultant.yearsOfExperience}
                onChange={(e) =>
                  setConsultant({ ...consultant, yearsOfExperience: e.target.value })
                }
                placeholder="Years"
                required
              />
            </Field>
            <Field label="Highest Qualification" required>
              <input
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                value={consultant.highestQualification}
                onChange={(e) =>
                  setConsultant({ ...consultant, highestQualification: e.target.value })
                }
                placeholder="e.g., PhD in Agriculture"
                required
              />
            </Field>
            <Field label="Organization Name">
              <input
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                value={consultant.organizationName}
                onChange={(e) =>
                  setConsultant({ ...consultant, organizationName: e.target.value })
                }
                placeholder="Organization (optional)"
              />
            </Field>
          </div>
        </div>

        {/* Services and Availability */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Services & Availability</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Consultation Types">
              <MultiSelect
                value={consultant.consultationTypes}
                onChange={(vals) => setConsultant({ ...consultant, consultationTypes: vals })}
                options={CONSULTATION_TYPES}
                placeholder="Select consultation types"
              />
            </Field>
            <Field label="Available Services">
              <MultiSelect
                value={consultant.availableServices}
                onChange={(vals) => setConsultant({ ...consultant, availableServices: vals })}
                options={AVAILABLE_SERVICES}
                placeholder="Select services"
              />
            </Field>
            <Field label="Service Regions">
              <MultiSelect
                value={consultant.serviceRegions}
                onChange={(vals) => setConsultant({ ...consultant, serviceRegions: vals })}
                options={SERVICE_REGIONS}
                placeholder="Select regions"
              />
            </Field>
            <Field label="Coverage Radius (km)">
              <input
                type="number"
                min="0"
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                value={consultant.coverageRadiusKm}
                onChange={(e) =>
                  setConsultant({ ...consultant, coverageRadiusKm: e.target.value })
                }
                placeholder="Radius in km"
              />
            </Field>
            <Field label="Available Days">
              <MultiSelect
                value={consultant.availableDays}
                onChange={(vals) => setConsultant({ ...consultant, availableDays: vals })}
                options={AVAILABLE_DAYS}
                placeholder="Select days"
              />
            </Field>
            <Field label="Available Time Slots">
              <MultiSelect
                value={consultant.availableTimeSlots}
                onChange={(vals) => setConsultant({ ...consultant, availableTimeSlots: vals })}
                options={TIME_SLOTS}
                placeholder="Select time slots"
              />
            </Field>
          </div>
        </div>

        {/* Professional Details */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <Briefcase className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Professional Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Fee Structure">
              <Select
                value={consultant.feeStructure}
                onChange={(val) => setConsultant({ ...consultant, feeStructure: val })}
                options={FEE_STRUCTURES}
                placeholder="Select fee structure"
              />
            </Field>
            <Field label="Notice Period">
              <Select
                value={consultant.noticePeriod}
                onChange={(val) => setConsultant({ ...consultant, noticePeriod: val })}
                options={NOTICE_PERIODS}
                placeholder="Select notice period"
              />
            </Field>
            <Field label="Languages">
              <MultiSelect
                value={consultant.languages}
                onChange={(vals) => setConsultant({ ...consultant, languages: vals })}
                options={LANGUAGES}
                placeholder="Select languages"
              />
            </Field>
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <Globe className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Social Links</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Facebook">
              <input
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                placeholder="Link or @username"
                value={social.facebook}
                onChange={(e) => setSocial({ ...social, facebook: e.target.value })}
              />
            </Field>
            <Field label="Instagram">
              <input
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                placeholder="Link or @username"
                value={social.instagram}
                onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
              />
            </Field>
            <Field label="LinkedIn">
              <input
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                placeholder="Link or @username"
                value={social.linkedin}
                onChange={(e) => setSocial({ ...social, linkedin: e.target.value })}
              />
            </Field>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Bio</h3>
          </div>
          <Field label="Short Bio">
            <textarea
              rows={4}
              className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all resize-none"
              value={consultant.bio}
              onChange={(e) => setConsultant({ ...consultant, bio: e.target.value })}
              placeholder="Tell us about yourself and your expertise..."
            />
          </Field>
        </div>

        {/* Error and Submit */}
        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{err}</span>
            </div>
          </div>
        )}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="px-10 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-700 hover:to-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 hover:scale-[1.02] transform"
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
              "Save & Finish"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}