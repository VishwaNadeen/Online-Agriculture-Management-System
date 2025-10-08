// src/pages/profile/FarmDetailsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/* ---------------- utils ---------------- */
function safeParse(json) { try { return JSON.parse(json); } catch { return null; } }
function readAuth() {
  const get = (k) => localStorage.getItem(k) ?? sessionStorage.getItem(k);
  const token = get("auth_token") || get("token") || get("user_token") || get("authToken") || "";
  const cachedUser = safeParse(get("auth_user"));
  const userId = get("userId") || get("tempUserId") || cachedUser?._id || "";
  return { token, userId, cachedUser };
}
const valueOrDash = (v) => (v === null || v === undefined || v === "" ? "-" : String(v));
const prettyDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");

/* ---------------- icons ---------------- */
const PencilIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M16.862 3.487a1.75 1.75 0 0 1 2.476 2.476l-10.3 10.3a4 4 0 0 1-1.657.98l-3.11.889.889-3.11a4 4 0 0 1 .98-1.657l10.3-10.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ---------------- shared UI bits (centered tabs, same look as profile page) ---------------- */
function CenterTabs({ active }) {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = [
    { key: "profile", label: "Profile Details", to: "/profile" },
    { key: "farm", label: "Farm Details", to: "/profile/farm" },
  ];
  return (
    <div className="px-6 pt-4 bg-white">
      <div className="w-full flex justify-center">
        <div className="inline-flex rounded-xl border border-emerald-200 overflow-hidden shadow-sm">
          {tabs.map((t) => {
            const isActive = active === t.key || location.pathname === t.to;
            return (
              <button
                key={t.key}
                onClick={() => navigate(t.to)}
                className={
                  "px-4 sm:px-6 py-2 text-sm font-semibold transition " +
                  (isActive
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-emerald-700 hover:bg-emerald-50")
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-6 rounded-xl border border-emerald-100/70 bg-gradient-to-b from-white to-emerald-50/20 p-5 shadow-sm">
      <h2 className="text-base sm:text-lg font-semibold text-emerald-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}
function Detail({ label, value }) {
  return (
    <div>
      <dt className="font-medium text-emerald-900">{label}</dt>
      <dd className="text-gray-700 break-words">{valueOrDash(value)}</dd>
    </div>
  );
}
function DetailInline({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
      <dt className="sm:w-56 font-medium text-emerald-900 shrink-0">{label}</dt>
      <dd className="text-gray-700 break-words flex-1">{valueOrDash(value)}</dd>
    </div>
  );
}
function DetailArrayInline({ label, items }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  const text = list.length ? list.join(", ") : "-";
  return <DetailInline label={label} value={text} />;
}

/* ---------------- page ---------------- */
export default function FarmDetailsPage() {
  const navigate = useNavigate();
  const [{ token, userId, cachedUser }, setAuth] = useState(() => readAuth());
  const [user, setUser] = useState(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [pageErr, setPageErr] = useState("");

  useEffect(() => { if (!token || !userId) navigate("/login"); }, [token, userId, navigate]);

  useEffect(() => {
    let abort = false;
    async function fetchUser() {
      if (!userId) return;
      try {
        setLoading(true);
        setPageErr("");
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
        if (!abort) setPageErr(e.message || "Failed to load profile");
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

  const handleEditFarm = () => {
    // Adjust this route to match your app's edit screen if different
    navigate("/farm/edit");
  };

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
          <p className="text-sm text-gray-600 mb-6">{pageErr || "Please sign in again."}</p>
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

  const farmer = user.farmer;
  const avatarSrc =
    user?.profilePicture ||
    "https://ui-avatars.com/api/?background=E6F4EA&color=166534&name=" +
      encodeURIComponent(`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User");
  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User";

  const farmAddrObj = farmer?.farmAddress || {};
  const farmAddrText = useMemo(() => {
    return [farmAddrObj.line1, farmAddrObj.line2, farmAddrObj.city, farmAddrObj.stateProvince, farmAddrObj.country, farmAddrObj.postalCode]
      .filter(Boolean)
      .join(", ");
  }, [farmAddrObj.line1, farmAddrObj.line2, farmAddrObj.city, farmAddrObj.stateProvince, farmAddrObj.country, farmAddrObj.postalCode]);

  const locText =
    farmer?.farmLocation && (farmer.farmLocation.lat != null || farmer.farmLocation.lng != null)
      ? `Lat: ${valueOrDash(farmer.farmLocation.lat)}, Lng: ${valueOrDash(farmer.farmLocation.lng)}`
      : "-";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="relative bg-white border border-emerald-100 shadow-xl rounded-2xl overflow-hidden">
          {/* Banner */}
          <div className="h-36 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500" />

          {/* Avatar + Name (centered, same as profile page) */}
          <div className="px-6 -mt-16 flex flex-col items-center text-center">
            <img
              src={avatarSrc}
              alt="Profile"
              className="w-32 h-32 rounded-full ring-4 ring-white object-cover shadow-lg"
            />
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-emerald-900 tracking-tight">{fullName}</h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 capitalize">
                {user.role || "user"}
              </span>
              <span className="text-xs text-gray-600">Member since {prettyDate(user.createdAt)}</span>
            </div>

            {/* Edit farm button */}
            <div className="mt-3">
              <button
                onClick={handleEditFarm}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition font-medium"
                aria-label="Edit Farm Details"
                title="Edit Farm Details"
              >
                <PencilIcon className="w-5 h-5" />
                Edit Farm Details
              </button>
            </div>
          </div>

          {/* Centered tabs (match profile design) */}
          <CenterTabs active="farm" />

          {/* Load error banner */}
          {pageErr ? (
            <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-2">{pageErr}</div>
          ) : null}

          {/* Content */}
          <div className="px-6 pb-8 pt-4">
            {!farmer ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3">
                No farm details found for this account.
              </div>
            ) : (
              <>
                {/* Farm details grid */}
                <Section title="Farm Details">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-sm">
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
                    <Detail label="Soil Type" value={farmer.soilType} />
                    <Detail label="Pesticide Usage" value={farmer.pesticideUsage} />
                    <Detail label="Fertilizer Practices" value={farmer.fertilizerPractices} />
                    <Detail label="Emergency Contact" value={farmer.emergencyContact} />
                  </dl>
                </Section>

                {/* Arrays / preferences */}
                <Section title="Practices & Preferences">
                  <div className="space-y-4 text-sm">
                    <DetailArrayInline
                      label="Sustainability Practices"
                      items={farmer.sustainabilityPractices}
                    />
                    <DetailArrayInline
                      label="Preferred Consultation Topics"
                      items={farmer.preferredConsultationTopics}
                    />
                  </div>
                </Section>

                {/* Address (separate section) */}
                <Section title="Farm Address">
                  {farmAddrText ? (
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {farmAddrObj.line1 && <div>{farmAddrObj.line1}</div>}
                      {farmAddrObj.line2 && <div>{farmAddrObj.line2}</div>}
                      <div>
                        {[farmAddrObj.city, farmAddrObj.stateProvince, farmAddrObj.postalCode]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      <div>{farmAddrObj.country || ""}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No farm address provided.</div>
                  )}
                </Section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
