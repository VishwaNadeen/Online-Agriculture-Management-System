// src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/* ---------------- utils ---------------- */
function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
function readAuth() {
  const get = (k) => localStorage.getItem(k) ?? sessionStorage.getItem(k);
  const token =
    get("auth_token") || get("token") || get("user_token") || get("authToken") || "";
  const cachedUser = safeParse(get("auth_user"));
  const userId = get("userId") || cachedUser?._id || "";
  return { token, userId, cachedUser };
}
const prettyDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");
const prettyDateTime = (d) => (d ? new Date(d).toLocaleString() : "-");
const valueOrDash = (v) => (v === null || v === undefined || v === "" ? "-" : String(v));

const Chip = ({ children }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 mr-1 mb-1">
    {children}
  </span>
);

/* ---------------- page ---------------- */
export default function Profile() {
  const navigate = useNavigate();
  const [{ token, userId, cachedUser }, setAuth] = useState(() => readAuth());
  const [user, setUser] = useState(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [err, setErr] = useState("");

  // guard
  useEffect(() => {
    if (!token || !userId) navigate("/login");
  }, [token, userId, navigate]);

  // fetch latest from backend
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
        if (!abort) {
          setUser(data);
          const raw = JSON.stringify(data);
          localStorage.setItem("auth_user", raw);
          sessionStorage.setItem("auth_user", raw);
          window.dispatchEvent(new Event("auth-changed"));
        }
      } catch (e) {
        if (!abort) setErr(e.message || "Failed to load profile");
      } finally {
        if (!abort) setLoading(false);
      }
    }
    fetchUser();
    return () => {
      abort = true;
    };
  }, [userId, token]);

  // react to auth changes (optional)
  useEffect(() => {
    const onAuthChanged = () => setAuth(readAuth());
    window.addEventListener("auth-changed", onAuthChanged);
    window.addEventListener("storage", onAuthChanged);
    return () => {
      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("storage", onAuthChanged);
    };
  }, []);

  if (!user && loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-emerald-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50 px-4">
        <div className="max-w-md w-full bg-white border border-emerald-100 rounded-xl shadow p-6 text-center">
          <p className="text-red-600 font-medium mb-3">Unable to load profile.</p>
          <p className="text-sm text-gray-600 mb-6">{err || "Please sign in again."}</p>
          <button
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const avatarSrc =
    user?.profilePicture ||
    "https://ui-avatars.com/api/?background=E6F4EA&color=166534&name=" +
      encodeURIComponent(`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User");

  const addressText = useMemo(() => {
    const a = user.address || {};
    return [a.line1, a.line2, a.city, a.stateProvince, a.country, a.postalCode]
      .filter(Boolean)
      .join(", ");
  }, [user.address]);

  const isFarmer = user.role === "farmer";
  const isConsultant = user.role === "consultant";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-emerald-100">
        {/* Header */}
        <div className="h-32 bg-emerald-600"></div>

        {/* Avatar */}
        <div className="relative px-6 -mt-16 flex justify-center">
          <img
            src={avatarSrc}
            alt="Profile"
            className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
          />
        </div>

        {/* Name / Role */}
        <div className="px-6 pt-4 pb-2 text-center">
          <h1 className="text-2xl font-bold text-emerald-800">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-emerald-600 mt-1 capitalize">{user.role}</p>
          <p className="text-xs text-gray-500 mt-1">
            Member since {prettyDate(user.createdAt)} • Last updated {prettyDateTime(user.updatedAt)}
          </p>
        </div>

        {/* Base Details (always shown) */}
        <section className="px-6 pb-8">
          <h2 className="text-lg font-semibold text-emerald-800 mb-3">Account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-sm">
            <Detail label="Email" value={user.email} />
            <Detail label="Phone" value={user.phone} />
            <Detail label="Date of Birth" value={prettyDate(user.dateOfBirth)} />
            <Detail label="Gender" value={user.gender || "-"} />
            <div className="sm:col-span-2">
              <Detail label="Address" value={addressText || "-"} />
            </div>
          </div>
        </section>

        {/* Role-based sections */}
        {isFarmer && <FarmerSection farmer={user.farmer} />}
        {isConsultant && <ConsultantSection consultant={user.consultant} />}

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex flex-wrap justify-end gap-3">
          <button
            onClick={() => navigate("/profile/edit")}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
          >
            Edit Profile
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- role sections ---------------- */
function FarmerSection({ farmer }) {
  if (!farmer) return null;

  const farmAddr = farmer.farmAddress
    ? [
        farmer.farmAddress.line1,
        farmer.farmAddress.line2,
        farmer.farmAddress.city,
        farmer.farmAddress.stateProvince,
        farmer.farmAddress.country,
        farmer.farmAddress.postalCode,
      ]
        .filter(Boolean)
        .join(", ")
    : "-";

  const loc =
    farmer.farmLocation &&
    (farmer.farmLocation.lat != null || farmer.farmLocation.lng != null)
      ? `Lat: ${valueOrDash(farmer.farmLocation.lat)}, Lng: ${valueOrDash(
          farmer.farmLocation.lng
        )}`
      : "-";

  return (
    <section className="px-6 pb-8">
      <h2 className="text-lg font-semibold text-emerald-800 mb-3">Farmer Details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-sm">
        <Detail label="Farm Name" value={farmer.farmName} />
        <Detail label="Farm Type" value={farmer.farmType} />
        <Detail
          label="Farm Size"
          value={
            farmer.farmSize != null
              ? `${farmer.farmSize} ${farmer.farmSizeUnit || ""}`.trim()
              : "-"
          }
        />
        <Detail label="Experience (years)" value={valueOrDash(farmer.experienceYears)} />
        <Detail label="Irrigation Method" value={farmer.primaryIrrigationMethod} />
        <Detail label="Water Source" value={farmer.waterSource} />
        <Detail label="Fertilizer Practices" value={farmer.fertilizerPractices} />
        <Detail label="Pesticide Usage" value={farmer.pesticideUsage} />
        <Detail label="Soil Type" value={farmer.soilType} />
        <Detail label="Emergency Contact" value={farmer.emergencyContact} />

        <DetailChips label="Sustainability Practices" items={farmer.sustainabilityPractices} />
        <DetailChips label="Preferred Consultation Topics" items={farmer.preferredConsultationTopics} />

        <div className="sm:col-span-2">
          <Detail label="Farm Address" value={farmAddr} />
        </div>
        <Detail label="Farm Location" value={loc} />
      </div>
    </section>
  );
}

function ConsultantSection({ consultant }) {
  if (!consultant) return null;

  return (
    <section className="px-6 pb-8">
      <h2 className="text-lg font-semibold text-emerald-800 mb-3">Consultant Details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-sm">
        <Detail label="Primary Specialization" value={consultant.primarySpecialization} />
        <Detail label="Years of Experience" value={valueOrDash(consultant.yearsOfExperience)} />
        <Detail label="Highest Qualification" value={consultant.highestQualification} />
        <Detail label="Organization" value={consultant.organizationName} />
        <Detail label="Fee Structure" value={consultant.feeStructure} />
        <Detail label="Notice Period" value={consultant.noticePeriod} />
        <Detail label="Coverage Radius (km)" value={valueOrDash(consultant.coverageRadiusKm)} />

        <DetailChips label="Secondary Expertise" items={consultant.secondaryExpertise} />
        <DetailChips label="Certifications" items={consultant.certifications} />
        <DetailChips label="Consultation Types" items={consultant.consultationTypes} />
        <DetailChips label="Available Services" items={consultant.availableServices} />
        <DetailChips label="Service Regions" items={consultant.serviceRegions} />
        <DetailChips label="Available Days" items={consultant.availableDays} />
        <DetailChips label="Available Time Slots" items={consultant.availableTimeSlots} />
        <DetailChips label="Languages" items={consultant.languages} />

        <div className="sm:col-span-2">
          <Detail label="Bio" value={consultant.bio || "-"} />
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-emerald-800 mb-1">Social Links</dt>
          <dd className="text-gray-700">
            {Array.isArray(consultant.socialLinks) && consultant.socialLinks.length ? (
              <ul className="space-y-1">
                {consultant.socialLinks.map((u, idx) => (
                  <li key={idx}>
                    <a
                      href={u}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline break-words"
                    >
                      {u}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              "-"
            )}
          </dd>
        </div>
      </div>
    </section>
  );
}

/* ---------------- presentational ---------------- */
function Detail({ label, value }) {
  return (
    <div>
      <dt className="font-medium text-emerald-800">{label}</dt>
      <dd className="text-gray-700 break-words">{valueOrDash(value)}</dd>
    </div>
  );
}
function DetailChips({ label, items }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  return (
    <div className="sm:col-span-2">
      <dt className="font-medium text-emerald-800">{label}</dt>
      <dd className="text-gray-700 mt-1">
        {list.length ? list.map((it, idx) => <Chip key={idx}>{it}</Chip>) : "-"}
      </dd>
    </div>
  );
}
