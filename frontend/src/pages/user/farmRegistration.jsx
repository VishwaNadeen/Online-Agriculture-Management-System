// src/pages/FarmerRegistration.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Leaf, MapPin, Sprout, Droplet } from "lucide-react";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

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
const FARM_TYPES = ["Organic", "Conventional", "Hydroponic", "Other"];
const IRRIGATION_METHODS = ["Drip", "Sprinkler", "Flood", "Center Pivot", "Manual", "Other"];
const WATER_SOURCES = ["Well", "River/Canal", "Rainwater Harvesting", "Municipal", "Other"];
const FERTILIZER_PRACTICES = ["Organic", "Synthetic", "Integrated Nutrient Management", "Other"];
const PESTICIDE_USAGE = ["None", "Low", "Moderate", "High", "Other"];
const SOIL_TYPES = ["Sandy", "Clay", "Silty", "Peaty", "Chalky", "Loamy", "Other"];
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
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
  }, [open, onClose, initialCenter]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Choose Farm Location</h3>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-900 text-lg">✕</button>
          </div>
          <div className="w-full h-[420px]" ref={divRef} />
          <div className="flex justify-end gap-3 px-4 py-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
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

/* ---------------- page ---------------- */
export default function FarmerRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [mounted, setMounted] = useState(false);

  // Countries (fetched)
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);

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

  // Farmer form state
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
    farmLocation: { lat: "", lng: "" },
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

  const [other, setOther] = useState({
    farmType: "",
    irrigation: "",
    waterSource: "",
    fertilizer: "",
    pesticide: "",
    soilType: "",
  });

  const canSubmit = useMemo(() => {
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
  }, [farmer, other]);

  // Map modal
  const [mapOpen, setMapOpen] = useState(false);

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

    const farmTypeResolved =
      farmer.farmType === "Other" ? other.farmType || "" : farmer.farmType;
    const irrigationResolved =
      farmer.primaryIrrigationMethod === "Other" ? other.irrigation || "" : farmer.primaryIrrigationMethod;
    const waterSourceResolved =
      farmer.waterSource === "Other" ? other.waterSource || "" : farmer.waterSource;
    const fertilizerResolved =
      farmer.fertilizerPractices === "Other" ? other.fertilizer || "" : farmer.fertilizerPractices;
    const pesticideResolved =
      farmer.pesticideUsage === "Other" ? other.pesticide || "" : farmer.pesticideUsage;
    const soilTypeResolved =
      farmer.soilType === "Other" ? other.soilType || "" : farmer.soilType;

    const payload = {
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
        experienceYears: farmer.experienceYears ? Number(farmer.experienceYears) : undefined,
        farmLocation: {
          lat: farmer.farmLocation.lat !== "" ? Number(farmer.farmLocation.lat) : undefined,
          lng: farmer.farmLocation.lng !== "" ? Number(farmer.farmLocation.lng) : undefined,
        },
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
      toast.success("Farmer details saved ✅");
      // Clear tempUserId since registration is complete
      localStorage.removeItem("tempUserId");
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
              <Sprout className="w-10 h-10 text-emerald-600" />
              <div className="absolute inset-0 bg-emerald-400 opacity-30 blur-xl" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
              Farmer Registration
            </h2>
          </div>
          <p className="text-emerald-600">Complete your farmer profile</p>
        </div>

        {/* Basic Information */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Basic Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Farm Name" required>
              <input
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                value={farmer.farmName}
                onChange={(e) => setFarmer({ ...farmer, farmName: e.target.value })}
                placeholder="Enter farm name"
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
                  className="mt-2 w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                  placeholder="Specify farm type"
                  value={other.farmType}
                  onChange={(e) => setOther((o) => ({ ...o, farmType: e.target.value }))}
                />
              )}
            </Field>
            <Field label="Farm Size" required>
              <input
                type="number"
                min="0"
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                value={farmer.farmSize}
                onChange={(e) => setFarmer({ ...farmer, farmSize: e.target.value })}
                placeholder="Enter size"
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
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                value={farmer.experienceYears}
                onChange={(e) => setFarmer({ ...farmer, experienceYears: e.target.value })}
                placeholder="Years of experience"
              />
            </Field>
          </div>
        </div>

        {/* Farm Address */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Farm Address</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                value={farmer.farmAddress.stateProvince}
                onChange={(e) =>
                  setFarmer({
                    ...farmer,
                    farmAddress: { ...farmer.farmAddress, stateProvince: e.target.value },
                  })
                }
                placeholder="Enter state/province"
              />
            </Field>
            <Field label="City" required>
              <input
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                value={farmer.farmAddress.city}
                onChange={(e) =>
                  setFarmer({
                    ...farmer,
                    farmAddress: { ...farmer.farmAddress, city: e.target.value },
                  })
                }
                placeholder="Enter city"
                required
              />
            </Field>
            <Field label="Postal Code">
              <input
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                value={farmer.farmAddress.postalCode}
                onChange={(e) =>
                  setFarmer({
                    ...farmer,
                    farmAddress: { ...farmer.farmAddress, postalCode: e.target.value },
                  })
                }
                placeholder="Enter postal code"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Address Line 1" required>
                <input
                  className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                  value={farmer.farmAddress.line1}
                  onChange={(e) =>
                    setFarmer({
                      ...farmer,
                      farmAddress: { ...farmer.farmAddress, line1: e.target.value },
                    })
                  }
                  placeholder="Street address"
                  required
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Address Line 2 (optional)">
                <input
                  className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                  value={farmer.farmAddress.line2}
                  onChange={(e) =>
                    setFarmer({
                      ...farmer,
                      farmAddress: { ...farmer.farmAddress, line2: e.target.value },
                    })
                  }
                  placeholder="Apartment, suite, etc."
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Farm Location */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Farm Location</h3>
          </div>
          <Field label="Farm Location" required>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="px-6 py-3 rounded-xl bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-200 transition-colors border-2 border-emerald-200"
              >
                Choose Location on Map
              </button>
              <div className="text-sm text-gray-600">
                {farmer.farmLocation.lat && farmer.farmLocation.lng
                  ? `📍 Lat: ${farmer.farmLocation.lat}, Lng: ${farmer.farmLocation.lng}`
                  : "No location selected"}
              </div>
            </div>
          </Field>
        </div>

        {/* Farming Practices */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <Droplet className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Farming Practices</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Irrigation Method">
              <Select
                value={farmer.primaryIrrigationMethod}
                onChange={(val) => setFarmer({ ...farmer, primaryIrrigationMethod: val })}
                options={IRRIGATION_METHODS}
                placeholder="Select irrigation method"
              />
              {farmer.primaryIrrigationMethod === "Other" && (
                <input
                  className="mt-2 w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                  placeholder="Specify irrigation method"
                  value={other.irrigation}
                  onChange={(e) => setOther((o) => ({ ...o, irrigation: e.target.value }))}
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
                  className="mt-2 w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                  placeholder="Specify water source"
                  value={other.waterSource}
                  onChange={(e) => setOther((o) => ({ ...o, waterSource: e.target.value }))}
                />
              )}
            </Field>
            <Field label="Fertilizer Practices">
              <Select
                value={farmer.fertilizerPractices}
                onChange={(val) => setFarmer({ ...farmer, fertilizerPractices: val })}
                options={FERTILIZER_PRACTICES}
                placeholder="Select fertilizer practice"
              />
              {farmer.fertilizerPractices === "Other" && (
                <input
                  className="mt-2 w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                  placeholder="Specify fertilizer practice"
                  value={other.fertilizer}
                  onChange={(e) => setOther((o) => ({ ...o, fertilizer: e.target.value }))}
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
                  className="mt-2 w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                  placeholder="Specify pesticide usage"
                  value={other.pesticide}
                  onChange={(e) => setOther((o) => ({ ...o, pesticide: e.target.value }))}
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
                  className="mt-2 w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
                  placeholder="Specify soil type"
                  value={other.soilType}
                  onChange={(e) => setOther((o) => ({ ...o, soilType: e.target.value }))}
                />
              )}
            </Field>
            <Field label="Emergency Contact" required>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-600 focus:border-[3px] transition-all"
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
        </div>

        {/* Preferences */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Preferences</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Sustainability Practices">
              <MultiSelect
                value={farmer.sustainabilityPractices}
                onChange={(vals) => setFarmer({ ...farmer, sustainabilityPractices: vals })}
                options={SUSTAINABILITY_OPTIONS}
                placeholder="Select practices"
              />
            </Field>
            <Field label="Preferred Consultation Topics">
              <MultiSelect
                value={farmer.preferredConsultationTopics}
                onChange={(vals) => setFarmer({ ...farmer, preferredConsultationTopics: vals })}
                options={CONSULT_PREF_TOPICS}
                placeholder="Select topics"
              />
            </Field>
          </div>
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
          lat: farmer.farmLocation.lat !== "" ? Number(farmer.farmLocation.lat) : 7.8731,
          lng: farmer.farmLocation.lng !== "" ? Number(farmer.farmLocation.lng) : 80.7718,
        }}
      />
    </div>
  );
}
