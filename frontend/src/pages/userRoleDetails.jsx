// src/pages/UserRoleDetails.jsx
import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000";

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

export default function UserRoleDetails() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("farmer"); // "farmer" | "consultant"
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // guard: need Step-1 to have saved a user
  useEffect(() => {
    const id = localStorage.getItem("tempUserId");
    if (!id) {
      alert("Please complete User Registration first.");
      navigate("/userRegistration"); // adjust if your path differs
    }
  }, [navigate]);

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
    farmLocation: { lat: "", lng: "" },
    experienceYears: "",
    primaryIrrigationMethod: "",
    waterSource: "",
    fertilizerPractices: "",
    pesticideUsage: "",
    soilType: "",
    sustainabilityPractices: [], // chips as CSV input
    preferredConsultationTopics: [],
    emergencyContact: "",
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
    socialLinks: [],
  });

  // util helpers to map comma-separated tags <-> array
  const arrToText = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");
  const textToArr = (txt) =>
    txt
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const canSubmit = useMemo(() => {
    // keep this light; backend will enforce schema anyway
    if (activeTab === "farmer") {
      return Boolean(
        farmer.farmName &&
          farmer.farmType &&
          farmer.farmSize &&
          farmer.farmSizeUnit &&
          farmer.farmAddress.country &&
          farmer.farmAddress.city &&
          farmer.emergencyContact
      );
    }
    // consultant
    return Boolean(
      consultant.primarySpecialization &&
        consultant.yearsOfExperience &&
        consultant.highestQualification
    );
  }, [activeTab, farmer, consultant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!canSubmit) return;

    const userId = localStorage.getItem("tempUserId");
    if (!userId) {
      alert("Missing user id. Please register again.");
      navigate("/userRegistration");
      return;
    }

    setLoading(true);
    try {
      let payload;
      if (activeTab === "farmer") {
        payload = {
          role: "farmer",
          farmer: {
            ...farmer,
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
          },
        };
      }

      await axios.put(
        `${API_BASE}/users/${userId}/role-details`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      alert("Details saved ✅");
      // you can route to dashboard or summary
      navigate("/"); // change as you like
    } catch (error) {
      console.error(error);
      setErr(error.response?.data?.message || "Failed to save details");
    } finally {
      setLoading(false);
    }
  };

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
            <div className="space-y-4">
              {/* Basic */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Farm Name</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.farmName}
                    onChange={(e) => setFarmer({ ...farmer, farmName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Farm Type</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Organic / Conventional / Hydroponic"
                    value={farmer.farmType}
                    onChange={(e) => setFarmer({ ...farmer, farmType: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1">Farm Size</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.farmSize}
                    onChange={(e) => setFarmer({ ...farmer, farmSize: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Unit</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 bg-white"
                    value={farmer.farmSizeUnit}
                    onChange={(e) => setFarmer({ ...farmer, farmSizeUnit: e.target.value })}
                  >
                    <option value="perches">perches</option>
                    <option value="acres">acres</option>
                    <option value="hectares">hectares</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Experience (years)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.experienceYears}
                    onChange={(e) =>
                      setFarmer({ ...farmer, experienceYears: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Farm Address */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Country</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.farmAddress.country}
                    onChange={(e) =>
                      setFarmer({
                        ...farmer,
                        farmAddress: { ...farmer.farmAddress, country: e.target.value },
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">State / Province</label>
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
                </div>
                <div>
                  <label className="block text-sm mb-1">City</label>
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
                </div>
                <div>
                  <label className="block text-sm mb-1">Postal Code</label>
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
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Address Line 1</label>
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
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Address Line 2 (optional)</label>
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
                </div>
              </div>

              {/* Optional quick location inputs */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.farmLocation.lat}
                    onChange={(e) =>
                      setFarmer({
                        ...farmer,
                        farmLocation: { ...farmer.farmLocation, lat: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.farmLocation.lng}
                    onChange={(e) =>
                      setFarmer({
                        ...farmer,
                        farmLocation: { ...farmer.farmLocation, lng: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              {/* Practices / Preferences */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Irrigation Method</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.primaryIrrigationMethod}
                    onChange={(e) =>
                      setFarmer({ ...farmer, primaryIrrigationMethod: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Water Source</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.waterSource}
                    onChange={(e) =>
                      setFarmer({ ...farmer, waterSource: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Fertilizer Practices</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.fertilizerPractices}
                    onChange={(e) =>
                      setFarmer({ ...farmer, fertilizerPractices: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Pesticide Usage</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.pesticideUsage}
                    onChange={(e) =>
                      setFarmer({ ...farmer, pesticideUsage: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Soil Type</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={farmer.soilType}
                    onChange={(e) => setFarmer({ ...farmer, soilType: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Emergency Contact</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Name - 07XXXXXXXX"
                    value={farmer.emergencyContact}
                    onChange={(e) =>
                      setFarmer({ ...farmer, emergencyContact: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Sustainability Practices (comma separated)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={arrToText(farmer.sustainabilityPractices)}
                    onChange={(e) =>
                      setFarmer({
                        ...farmer,
                        sustainabilityPractices: textToArr(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Preferred Consultation Topics (comma separated)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={arrToText(farmer.preferredConsultationTopics)}
                    onChange={(e) =>
                      setFarmer({
                        ...farmer,
                        preferredConsultationTopics: textToArr(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Consultant core */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Primary Specialization</label>
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
                </div>
                <div>
                  <label className="block text-sm mb-1">Years of Experience</label>
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
                </div>
                <div>
                  <label className="block text-sm mb-1">Highest Qualification</label>
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
                </div>
                <div>
                  <label className="block text-sm mb-1">Organization Name</label>
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
                </div>
              </div>

              {/* Tags / arrays */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Secondary Expertise (comma separated)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={arrToText(consultant.secondaryExpertise)}
                    onChange={(e) =>
                      setConsultant({
                        ...consultant,
                        secondaryExpertise: textToArr(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Certifications (comma separated)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={arrToText(consultant.certifications)}
                    onChange={(e) =>
                      setConsultant({
                        ...consultant,
                        certifications: textToArr(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Consultation Types (comma separated)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={arrToText(consultant.consultationTypes)}
                    onChange={(e) =>
                      setConsultant({
                        ...consultant,
                        consultationTypes: textToArr(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Available Services (comma separated)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={arrToText(consultant.availableServices)}
                    onChange={(e) =>
                      setConsultant({
                        ...consultant,
                        availableServices: textToArr(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Service Regions (comma separated)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={arrToText(consultant.serviceRegions)}
                    onChange={(e) =>
                      setConsultant({
                        ...consultant,
                        serviceRegions: textToArr(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Coverage Radius (km)</label>
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
                </div>
                <div>
                  <label className="block text-sm mb-1">Available Days (comma separated – Mon,Tue,...)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={arrToText(consultant.availableDays)}
                    onChange={(e) =>
                      setConsultant({
                        ...consultant,
                        availableDays: textToArr(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Available Time Slots (comma separated – morning,afternoon,evening)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={arrToText(consultant.availableTimeSlots)}
                    onChange={(e) =>
                      setConsultant({
                        ...consultant,
                        availableTimeSlots: textToArr(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* More */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Fee Structure</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Hourly / Per Visit / Negotiable"
                    value={consultant.feeStructure}
                    onChange={(e) =>
                      setConsultant({ ...consultant, feeStructure: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Notice Period</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="24 hours / 48 hours"
                    value={consultant.noticePeriod}
                    onChange={(e) =>
                      setConsultant({ ...consultant, noticePeriod: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Languages (comma separated)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={arrToText(consultant.languages)}
                    onChange={(e) =>
                      setConsultant({
                        ...consultant,
                        languages: textToArr(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Social Links (comma separated URLs)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={arrToText(consultant.socialLinks)}
                    onChange={(e) =>
                      setConsultant({
                        ...consultant,
                        socialLinks: textToArr(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Short Bio</label>
                <textarea
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2"
                  value={consultant.bio}
                  onChange={(e) =>
                    setConsultant({ ...consultant, bio: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {err && <p className="text-red-600 text-sm mt-3">{err}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold shadow hover:bg-gray-200"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 disabled:bg-gray-400"
          >
            {loading ? "Saving..." : "Save & Finish"}
          </button>
        </div>
      </form>
    </div>
  );
}
