// src/pages/UserRoleDetails.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

/* ---------------- small ui helpers ---------------- */
const TabBtn = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={
      "px-4 py-2 rounded-t-xl font-semibold " +
      (active
        ? "bg-emerald-600 text-white"
        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100")
    }
  >
    {children}
  </button>
);

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-sm mb-1">
      {label} {required ? <span className="text-red-600">*</span> : null}
    </label>
    {children}
  </div>
);

const Select = ({ value, onChange, options, placeholder = "Select...", disabled }) => (
  <select
    className="w-full border rounded-lg px-3 py-2 bg-white"
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

const MultiSelect = ({
  value = [],
  onChange,
  options,
  placeholder = "Select...",
}) => {
  const toggle = (val) => {
    const exists = value.includes(val);
    onChange(exists ? value.filter((v) => v !== val) : [...value, val]);
  };
  return (
    <div className="w-full border rounded-lg px-2 py-2 bg-white">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((v) => (
          <span
            key={v}
            className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
          >
            {v}
          </span>
        ))}
        {value.length === 0 ? (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={
              "text-sm px-2 py-1 rounded-md border " +
              (value.includes(opt)
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50")
            }
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ---------------- data dictionaries ---------------- */
const FARM_TYPES = ["Organic", "Conventional", "Hydroponic", "Other"];
const IRRIGATION_METHODS = [
  "Drip",
  "Sprinkler",
  "Flood",
  "Center Pivot",
  "Manual",
  "Other",
];
const WATER_SOURCES = [
  "Well",
  "River/Canal",
  "Rainwater Harvesting",
  "Municipal",
  "Other",
];
const FERTILIZER_PRACTICES = [
  "Organic",
  "Synthetic",
  "Integrated Nutrient Management",
  "Other",
];
const PESTICIDE_USAGE = ["None", "Low", "Moderate", "High", "Other"];
const SOIL_TYPES = [
  "Sandy",
  "Clay",
  "Silty",
  "Peaty",
  "Chalky",
  "Loamy",
  "Other",
];

const SUSTAINABILITY_OPTIONS = [
  "Crop Rotation",
  "Cover Cropping",
  "Reduced Tillage",
  "Composting",
  "Agroforestry",
  "Water Conservation",
  "Integrated Pest Management",
];
const CONSULT_PREF_TOPICS = [
  "Pest Management",
  "Soil Health",
  "Irrigation Optimization",
  "Fertilizer Planning",
  "Crop Planning",
  "Sustainability Strategy",
];

/* Consultant dictionaries */
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
const SERVICE_REGIONS = [
  "Local",
  "District-wide",
  "Province-wide",
  "Nationwide",
  "International",
];
const AVAILABLE_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const TIME_SLOTS = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
];
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

/* ---------------- Google Maps picker ---------------- */
function loadGoogleMaps(key) {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) return resolve(window.google);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key
    )}`;
    script.async = true;
    script.onerror = reject;
    script.onload = () => resolve(window.google);
    document.head.appendChild(script);
  });
}

const MapPickerModal = ({ open, onClose, onPick, initialCenter = { lat: 7.8731, lng: 80.7718 } }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const divRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let map;
    (async () => {
      try {
        if (!GMAPS_KEY) {
          toast.error("Google Maps key missing. Set VITE_GOOGLE_MAPS_API_KEY.");
          onClose();
          return;
        }
        await loadGoogleMaps(GMAPS_KEY);
        map = new window.google.maps.Map(divRef.current, {
          center: initialCenter,
          zoom: 7,
        });
        const placeMarker = (pos) => {
          if (markerRef.current) markerRef.current.setMap(null);
          markerRef.current = new window.google.maps.Marker({ position: pos, map });
        };
        map.addListener("click", (e) => {
          const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          placeMarker(pos);
          mapRef.current = pos;
        });
      } catch (e) {
        console.error(e);
        toast.error("Failed to load Google Maps.");
        onClose();
      }
    })();
    return () => {
      // cleanup is automatic when modal unmounts
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border w-full max-w-3xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-emerald-800">Choose Farm Location</h3>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
              ✕
            </button>
          </div>
          <div className="w-full h-[420px]" ref={divRef} />
          <div className="flex justify-end gap-2 px-4 py-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!mapRef.current) {
                  toast("Click on the map to drop a pin.", { icon: "📍" });
                  return;
                }
                onPick(mapRef.current);
              }}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
            >
              Use This Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- main page ---------------- */
export default function UserRoleDetails() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("farmer"); // "farmer" | "consultant"
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Countries (fetched, not hardcoded)
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("tempUserId");
    if (!id) {
      toast.error("Please complete User Registration first.");
      navigate("/userRegistration");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name");
        const data = await res.json();
        const names = (data || [])
          .map((c) => c?.name?.common)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        setCountries(names);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load countries.");
      } finally {
        setCountriesLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // ====== Farmer form state ======
  const [farmer, setFarmer] = useState({
    farmName: "",
    farmType: "",
    farmSize: "",
    farmSizeUnit: "acres",
    farmAddress: {
      country: "",
      stateProvince: "",
      city: "",
      postalCode: "",
      line1: "",
      line2: "",
    },
    farmLocation: { lat: "", lng: "" }, // set by MapPicker
    experienceYears: "",
    primaryIrrigationMethod: "",
    waterSource: "",
    fertilizerPractices: "",
    pesticideUsage: "",
    soilType: "",
    sustainabilityPractices: [],
    preferredConsultationTopics: [],
    emergencyContact: "",
  });

  // If "Other" selected in single-selects, show a free text box
  const [other, setOther] = useState({
    farmType: "",
    irrigation: "",
    waterSource: "",
    fertilizer: "",
    pesticide: "",
    soilType: "",
  });

  // ====== Consultant form state ======
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
    socialLinks: [], // built from the inputs below
  });

  const [social, setSocial] = useState({
    facebook: "",
    instagram: "",
    linkedin: "",
  });

  // Map modal
  const [mapOpen, setMapOpen] = useState(false);

  // util helpers
  const arrToText = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");
  const textToArr = (txt) =>
    txt
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const canSubmit = useMemo(() => {
    if (activeTab === "farmer") {
      return Boolean(
        farmer.farmName &&
          (farmer.farmType || other.farmType) &&
          farmer.farmSize &&
          farmer.farmSizeUnit &&
          farmer.farmAddress.country &&
          farmer.farmAddress.city &&
          farmer.emergencyContact &&
          farmer.farmLocation.lat &&
          farmer.farmLocation.lng
      );
    }
    return Boolean(
      consultant.primarySpecialization &&
        consultant.yearsOfExperience &&
        consultant.highestQualification
    );
  }, [activeTab, farmer, consultant, other]);

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

    // Build payload matching backend's pickUpdatable
    let payload;
    if (activeTab === "farmer") {
      const farmTypeResolved =
        farmer.farmType === "Other" ? (other.farmType || "") : farmer.farmType;

      const irrigationResolved =
        farmer.primaryIrrigationMethod === "Other"
          ? (other.irrigation || "")
          : farmer.primaryIrrigationMethod;

      const waterSourceResolved =
        farmer.waterSource === "Other" ? (other.waterSource || "") : farmer.waterSource;

      const fertilizerResolved =
        farmer.fertilizerPractices === "Other"
          ? (other.fertilizer || "")
          : farmer.fertilizerPractices;

      const pesticideResolved =
        farmer.pesticideUsage === "Other" ? (other.pesticide || "") : farmer.pesticideUsage;

      const soilTypeResolved =
        farmer.soilType === "Other" ? (other.soilType || "") : farmer.soilType;

      payload = {
        role: "farmer",
        farmer: {
          ...farmer,
          farmType: farmTypeResolved,
          primaryIrrigationMethod: irrigationResolved,
          waterSource: waterSourceResolved,
          fertilizerPractices: fertilizerResolved,
          pesticideUsage: pesticideResolved,
          soilType: soilTypeResolved,
          farmSize: farmer.farmSize ? Number(farmer.farmSize) : undefined,
          experienceYears: farmer.experienceYears
            ? Number(farmer.experienceYears)
            : undefined,
          farmLocation: {
            lat:
              farmer.farmLocation.lat !== ""
                ? Number(farmer.farmLocation.lat)
                : undefined,
            lng:
              farmer.farmLocation.lng !== ""
                ? Number(farmer.farmLocation.lng)
                : undefined,
          },
        },
      };
    } else {
      payload = {
        role: "consultant",
        consultant: {
          ...consultant,
          yearsOfExperience: consultant.yearsOfExperience
            ? Number(consultant.yearsOfExperience)
            : undefined,
          coverageRadiusKm: consultant.coverageRadiusKm
            ? Number(consultant.coverageRadiusKm)
            : undefined,
          socialLinks: normSocialLinks(),
        },
      };
    }

    setLoading(true);
    try {
      await axios.patch(`${BASE}/users/${userId}`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Details saved ✅");
      navigate("/"); // or another route
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to save details";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- render ---------------- */
  return (
    <div className="min-h-screen flex justify-center items-start bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl border border-emerald-100 max-w-3xl w-full"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-700 mb-4 text-center">
          Select Your Profile Type
        </h2>

        {/* Tabs */}
        <div className="flex gap-2">
          <TabBtn active={activeTab === "farmer"} onClick={() => setActiveTab("farmer")}>
            Farmer
          </TabBtn>
          <TabBtn
            active={activeTab === "consultant"}
            onClick={() => setActiveTab("consultant")}
          >
            Consultant
          </TabBtn>
        </div>

        <div className="border border-emerald-100 rounded-b-xl rounded-tr-xl p-5 md:p-6 mt-0 bg-white">
          {activeTab === "farmer" ? (
            /* --- Farmer form --- */
            <div className="space-y-5">
              {/* Basic */}
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Farm Name" required>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.farmName}
                    onChange={(e) => setFarmer({ ...farmer, farmName: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Farm Type" required>
                  <Select
                    value={farmer.farmType}
                    onChange={(val) => setFarmer({ ...farmer, farmType: val })}
                    options={FARM_TYPES}
                    placeholder="Select farm type"
                  />
                  {farmer.farmType === "Other" && (
                    <input
                      className="mt-2 w-full border rounded-lg px-3 py-2"
                      placeholder="Specify farm type"
                      value={other.farmType}
                      onChange={(e) =>
                        setOther((o) => ({ ...o, farmType: e.target.value }))
                      }
                    />
                  )}
                </Field>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Farm Size" required>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.farmSize}
                    onChange={(e) => setFarmer({ ...farmer, farmSize: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Unit" required>
                  <Select
                    value={farmer.farmSizeUnit}
                    onChange={(val) => setFarmer({ ...farmer, farmSizeUnit: val })}
                    options={["perches", "acres", "hectares"]}
                    placeholder="Select unit"
                  />
                </Field>
                <Field label="Experience (years)">
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.experienceYears}
                    onChange={(e) =>
                      setFarmer({ ...farmer, experienceYears: e.target.value })
                    }
                  />
                </Field>
              </div>

              {/* Farm Address */}
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Country" required>
                  <Select
                    value={farmer.farmAddress.country}
                    onChange={(val) =>
                      setFarmer({
                        ...farmer,
                        farmAddress: { ...farmer.farmAddress, country: val },
                      })
                    }
                    options={countries}
                    placeholder={countriesLoading ? "Loading..." : "Select country"}
                    disabled={countriesLoading}
                  />
                </Field>

                <Field label="State / Province">
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.farmAddress.stateProvince}
                    onChange={(e) =>
                      setFarmer({
                        ...farmer,
                        farmAddress: {
                          ...farmer.farmAddress,
                          stateProvince: e.target.value,
                        },
                      })
                    }
                  />
                </Field>

                <Field label="City" required>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.farmAddress.city}
                    onChange={(e) =>
                      setFarmer({
                        ...farmer,
                        farmAddress: { ...farmer.farmAddress, city: e.target.value },
                      })
                    }
                    required
                  />
                </Field>

                <Field label="Postal Code">
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.farmAddress.postalCode}
                    onChange={(e) =>
                      setFarmer({
                        ...farmer,
                        farmAddress: {
                          ...farmer.farmAddress,
                          postalCode: e.target.value,
                        },
                      })
                    }
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Address Line 1" required>
                    <input
                      className="w-full border rounded-lg px-3 py-2"
                      value={farmer.farmAddress.line1}
                      onChange={(e) =>
                        setFarmer({
                          ...farmer,
                          farmAddress: { ...farmer.farmAddress, line1: e.target.value },
                        })
                      }
                      required
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Address Line 2 (optional)">
                    <input
                      className="w-full border rounded-lg px-3 py-2"
                      value={farmer.farmAddress.line2}
                      onChange={(e) =>
                        setFarmer({
                          ...farmer,
                          farmAddress: { ...farmer.farmAddress, line2: e.target.value },
                        })
                      }
                    />
                  </Field>
                </div>
              </div>

              {/* Choose Location (Map) */}
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Farm Location" required>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMapOpen(true)}
                      className="px-3 py-2 rounded-lg border bg-white text-emerald-700 hover:bg-emerald-50"
                    >
                      Choose Location on Map
                    </button>
                    <div className="text-sm text-gray-600">
                      {farmer.farmLocation.lat && farmer.farmLocation.lng
                        ? `Lat: ${farmer.farmLocation.lat}, Lng: ${farmer.farmLocation.lng}`
                        : "No location selected"}
                    </div>
                  </div>
                </Field>
              </div>

              {/* Practices / Preferences dropdowns with "Other" */}
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Irrigation Method">
                  <Select
                    value={farmer.primaryIrrigationMethod}
                    onChange={(val) =>
                      setFarmer({ ...farmer, primaryIrrigationMethod: val })
                    }
                    options={IRRIGATION_METHODS}
                    placeholder="Select irrigation method"
                  />
                  {farmer.primaryIrrigationMethod === "Other" && (
                    <input
                      className="mt-2 w-full border rounded-lg px-3 py-2"
                      placeholder="Specify irrigation method"
                      value={other.irrigation}
                      onChange={(e) =>
                        setOther((o) => ({ ...o, irrigation: e.target.value }))
                      }
                    />
                  )}
                </Field>

                <Field label="Water Source">
                  <Select
                    value={farmer.waterSource}
                    onChange={(val) => setFarmer({ ...farmer, waterSource: val })}
                    options={WATER_SOURCES}
                    placeholder="Select water source"
                  />
                  {farmer.waterSource === "Other" && (
                    <input
                      className="mt-2 w-full border rounded-lg px-3 py-2"
                      placeholder="Specify water source"
                      value={other.waterSource}
                      onChange={(e) =>
                        setOther((o) => ({ ...o, waterSource: e.target.value }))
                      }
                    />
                  )}
                </Field>

                <Field label="Fertilizer Practices">
                  <Select
                    value={farmer.fertilizerPractices}
                    onChange={(val) =>
                      setFarmer({ ...farmer, fertilizerPractices: val })
                    }
                    options={FERTILIZER_PRACTICES}
                    placeholder="Select fertilizer practice"
                  />
                  {farmer.fertilizerPractices === "Other" && (
                    <input
                      className="mt-2 w-full border rounded-lg px-3 py-2"
                      placeholder="Specify fertilizer practice"
                      value={other.fertilizer}
                      onChange={(e) =>
                        setOther((o) => ({ ...o, fertilizer: e.target.value }))
                      }
                    />
                  )}
                </Field>

                <Field label="Pesticide Usage">
                  <Select
                    value={farmer.pesticideUsage}
                    onChange={(val) => setFarmer({ ...farmer, pesticideUsage: val })}
                    options={PESTICIDE_USAGE}
                    placeholder="Select pesticide usage"
                  />
                  {farmer.pesticideUsage === "Other" && (
                    <input
                      className="mt-2 w-full border rounded-lg px-3 py-2"
                      placeholder="Specify pesticide usage"
                      value={other.pesticide}
                      onChange={(e) =>
                        setOther((o) => ({ ...o, pesticide: e.target.value }))
                      }
                    />
                  )}
                </Field>

                <Field label="Soil Type">
                  <Select
                    value={farmer.soilType}
                    onChange={(val) => setFarmer({ ...farmer, soilType: val })}
                    options={SOIL_TYPES}
                    placeholder="Select soil type"
                  />
                  {farmer.soilType === "Other" && (
                    <input
                      className="mt-2 w-full border rounded-lg px-3 py-2"
                      placeholder="Specify soil type"
                      value={other.soilType}
                      onChange={(e) =>
                        setOther((o) => ({ ...o, soilType: e.target.value }))
                      }
                    />
                  )}
                </Field>

                <Field label="Emergency Contact" required>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="07XXXXXXXX"
                    value={farmer.emergencyContact}
                    onChange={(e) =>
                      setFarmer({
                        ...farmer,
                        emergencyContact: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    required
                  />
                </Field>
              </div>

              {/* Multi-selects */}
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Sustainability Practices">
                  <MultiSelect
                    value={farmer.sustainabilityPractices}
                    onChange={(vals) =>
                      setFarmer({ ...farmer, sustainabilityPractices: vals })
                    }
                    options={SUSTAINABILITY_OPTIONS}
                    placeholder="Choose items"
                  />
                </Field>

                <Field label="Preferred Consultation Topics">
                  <MultiSelect
                    value={farmer.preferredConsultationTopics}
                    onChange={(vals) =>
                      setFarmer({ ...farmer, preferredConsultationTopics: vals })
                    }
                    options={CONSULT_PREF_TOPICS}
                    placeholder="Choose topics"
                  />
                </Field>
              </div>
            </div>
          ) : (
            /* --- Consultant form --- */
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Primary Specialization" required>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={consultant.primarySpecialization}
                    onChange={(e) =>
                      setConsultant({
                        ...consultant,
                        primarySpecialization: e.target.value,
                      })
                    }
                    required
                  />
                </Field>
                <Field label="Years of Experience" required>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-lg px-3 py-2"
                    value={consultant.yearsOfExperience}
                    onChange={(e) =>
                      setConsultant({ ...consultant, yearsOfExperience: e.target.value })
                    }
                    required
                  />
                </Field>
                <Field label="Highest Qualification" required>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={consultant.highestQualification}
                    onChange={(e) =>
                      setConsultant({
                        ...consultant,
                        highestQualification: e.target.value,
                      })
                    }
                    required
                  />
                </Field>
                <Field label="Organization Name">
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={consultant.organizationName}
                    onChange={(e) =>
                      setConsultant({
                        ...consultant,
                        organizationName: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>

              {/* Multi-select groups */}
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Consultation Types">
                  <MultiSelect
                    value={consultant.consultationTypes}
                    onChange={(vals) =>
                      setConsultant({ ...consultant, consultationTypes: vals })
                    }
                    options={CONSULTATION_TYPES}
                    placeholder="Choose types"
                  />
                </Field>
                <Field label="Available Services">
                  <MultiSelect
                    value={consultant.availableServices}
                    onChange={(vals) =>
                      setConsultant({ ...consultant, availableServices: vals })
                    }
                    options={AVAILABLE_SERVICES}
                    placeholder="Choose services"
                  />
                </Field>
                <Field label="Service Regions">
                  <MultiSelect
                    value={consultant.serviceRegions}
                    onChange={(vals) =>
                      setConsultant({ ...consultant, serviceRegions: vals })
                    }
                    options={SERVICE_REGIONS}
                    placeholder="Choose regions"
                  />
                </Field>
                <Field label="Coverage (km)">
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-lg px-3 py-2"
                    value={consultant.coverageRadiusKm}
                    onChange={(e) =>
                      setConsultant({
                        ...consultant,
                        coverageRadiusKm: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Available Days">
                  <MultiSelect
                    value={consultant.availableDays}
                    onChange={(vals) =>
                      setConsultant({ ...consultant, availableDays: vals })
                    }
                    options={AVAILABLE_DAYS}
                    placeholder="Choose days"
                  />
                </Field>
                <Field label="Available Time Slots">
                  <MultiSelect
                    value={consultant.availableTimeSlots}
                    onChange={(vals) =>
                      setConsultant({ ...consultant, availableTimeSlots: vals })
                    }
                    options={TIME_SLOTS}
                    placeholder="Choose slots"
                  />
                </Field>
              </div>

              {/* Fee, Notice, Languages */}
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Fee Structure">
                  <Select
                    value={consultant.feeStructure}
                    onChange={(val) =>
                      setConsultant({ ...consultant, feeStructure: val })
                    }
                    options={FEE_STRUCTURES}
                    placeholder="Select fee"
                  />
                </Field>
                <Field label="Notice Period">
                  <Select
                    value={consultant.noticePeriod}
                    onChange={(val) =>
                      setConsultant({ ...consultant, noticePeriod: val })
                    }
                    options={NOTICE_PERIODS}
                    placeholder="Select notice"
                  />
                </Field>
                <Field label="Languages">
                  <MultiSelect
                    value={consultant.languages}
                    onChange={(vals) =>
                      setConsultant({ ...consultant, languages: vals })
                    }
                    options={LANGUAGES}
                    placeholder="Pick languages"
                  />
                </Field>
              </div>

              {/* Social links (Facebook/Instagram/LinkedIn) */}
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Facebook">
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="link or @username"
                    value={social.facebook}
                    onChange={(e) => setSocial({ ...social, facebook: e.target.value })}
                  />
                </Field>
                <Field label="Instagram">
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="link or @username"
                    value={social.instagram}
                    onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
                  />
                </Field>
                <Field label="LinkedIn">
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="link or @username"
                    value={social.linkedin}
                    onChange={(e) => setSocial({ ...social, linkedin: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Short Bio">
                <textarea
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2"
                  value={consultant.bio}
                  onChange={(e) => setConsultant({ ...consultant, bio: e.target.value })}
                />
              </Field>
            </div>
          )}
        </div>

        {err && <p className="text-red-600 text-sm mt-3">{err}</p>}

        {/* Centered Save button */}
        <div className="mt-6 flex justify-center">
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 disabled:bg-gray-400"
          >
            {loading ? "Saving..." : "Save & Finish"}
          </button>
        </div>
      </form>

      {/* Map modal */}
      <MapPickerModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onPick={(pos) => {
          setFarmer((f) => ({ ...f, farmLocation: { lat: pos.lat, lng: pos.lng } }));
          setMapOpen(false);
          toast.success("Location selected");
        }}
        initialCenter={{
          lat:
            farmer.farmLocation.lat !== ""
              ? Number(farmer.farmLocation.lat)
              : 7.8731,
          lng:
            farmer.farmLocation.lng !== ""
              ? Number(farmer.farmLocation.lng)
              : 80.7718,
        }}
      />
    </div>
  );
}
