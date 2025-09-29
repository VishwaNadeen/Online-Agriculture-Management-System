import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/* ---------------- small ui helpers ---------------- */
const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const Select = ({ value, onChange, options, placeholder = "Select...", disabled }) => (
  <select
    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
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
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm text-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      >
        {value.length > 0 ? (
          <span>{value.join(", ")}</span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center px-3 py-2 hover:bg-emerald-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.includes(opt)}
                onChange={() => toggleOption(opt)}
                className="mr-2 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
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
      await axios.patch(`${BASE}/users/${userId}`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Consultant details saved ✅");
      navigate("/");
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message || error.message || "Failed to save details";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-lime-50 flex items-start justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8"
      >
        <h2 className="text-3xl font-bold text-emerald-700 mb-8 text-center">
          Consultant Registration
        </h2>

        {/* Personal Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Primary Specialization" required>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={consultant.primarySpecialization}
                onChange={(e) =>
                  setConsultant({ ...consultant, primarySpecialization: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Years of Experience" required>
              <input
                type="number"
                min="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={consultant.yearsOfExperience}
                onChange={(e) =>
                  setConsultant({ ...consultant, yearsOfExperience: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Highest Qualification" required>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={consultant.highestQualification}
                onChange={(e) =>
                  setConsultant({ ...consultant, highestQualification: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Organization Name">
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={consultant.organizationName}
                onChange={(e) =>
                  setConsultant({ ...consultant, organizationName: e.target.value })
                }
              />
            </Field>
          </div>
        </div>

        {/* Services and Availability */}
        <div className="mt-8 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Services & Availability</h3>
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={consultant.coverageRadiusKm}
                onChange={(e) =>
                  setConsultant({ ...consultant, coverageRadiusKm: e.target.value })
                }
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
        <div className="mt-8 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Professional Details</h3>
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
        <div className="mt-8 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Social Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Facebook">
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Link or @username"
                value={social.facebook}
                onChange={(e) => setSocial({ ...social, facebook: e.target.value })}
              />
            </Field>
            <Field label="Instagram">
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Link or @username"
                value={social.instagram}
                onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
              />
            </Field>
            <Field label="LinkedIn">
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Link or @username"
                value={social.linkedin}
                onChange={(e) => setSocial({ ...social, linkedin: e.target.value })}
              />
            </Field>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-8 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Bio</h3>
          <Field label="Short Bio">
            <textarea
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={consultant.bio}
              onChange={(e) => setConsultant({ ...consultant, bio: e.target.value })}
            />
          </Field>
        </div>

        {/* Error and Submit */}
        {err && <p className="text-red-500 text-sm mt-6">{err}</p>}
        <div className="mt-8 flex justify-center">
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="px-8 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save & Finish"}
          </button>
        </div>
      </form>
    </div>
  );
}