// src/pages/profile/ConsultantDetailsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
const valueOrDash = (v) => (v === null || v === undefined || v === "" ? "-" : String(v));
const prettyList = (arr) => Array.isArray(arr) && arr.length ? arr : null;
const prettyDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");

function isConsultantUser(u) {
  if (!u) return false;
  const role = (u.role || "").toString().toLowerCase();
  if (role === "consultant") return true;
  if (Array.isArray(u.roles) && u.roles.map(String).map(s => s.toLowerCase()).includes("consultant")) return true;
  if (u.consultant?.bio || u.consultant?.primarySpecialization || u.consultant?.yearsOfExperience) return true;
  if (u.consultantProfile?.active) return true; // if you use this field elsewhere
  return false;
}

/* ---------------- icons ---------------- */
const PencilIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M16.862 3.487a1.75 1.75 0 0 1 2.476 2.476l-10.3 10.3a4 4 0 0 1-1.657.98l-3.11.889.889-3.11a4 4 0 0 1 .98-1.657l10.3-10.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ---------------- shared UI bits ---------------- */
function CenterTabs({ active, isConsultant }) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { key: "profile", label: "Profile Details", to: "/profile" },
    isConsultant
      ? { key: "consult", label: "Consultant Details", to: "/profile/consultant" }
      : { key: "farm", label: "Farm Details", to: "/profile/farm" },
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

function Section({ title, children, right }) {
  return (
    <section className="mb-6 rounded-xl border border-emerald-100/70 bg-gradient-to-b from-white to-emerald-50/20 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-emerald-900">{title}</h2>
        {right}
      </div>
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
function Chips({ items }) {
  if (!items?.length) return <span className="text-gray-500 text-sm">-</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it, i) => (
        <span
          key={i}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"
        >
          {String(it)}
        </span>
      ))}
    </div>
  );
}

/* ---------------- page ---------------- */
export default function ConsultantDetailsPage() {
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
          <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700" onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const consultant = user.consultant || {};
  const consultantActive = isConsultantUser(user);

  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User";
  const avatarSrc =
    user?.profilePicture ||
    "https://ui-avatars.com/api/?background=E6F4EA&color=166534&name=" +
      encodeURIComponent(fullName || "User");

  const editPath = "/profile/consultant/edit"; // change if your route differs

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="relative bg-white border border-emerald-100 shadow-xl rounded-2xl overflow-hidden">
          {/* Banner */}
          <div className="h-36 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500" />

          {/* Header */}
          <div className="px-6 -mt-16 flex flex-col items-center text-center">
            <img
              src={avatarSrc}
              alt="Profile"
              className="w-32 h-32 rounded-full ring-4 ring-white object-cover shadow-lg"
            />
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-emerald-900 tracking-tight">
              {fullName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              {/* Single role chip only */}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 capitalize">
                {user.role || "user"}
              </span>
              {/* Member since text (same as Profile page) */}
              <span className="text-xs text-gray-600">Member since {prettyDate(user.createdAt)}</span>
            </div>

            <div className="mt-3">
              <button
                onClick={() => navigate(editPath)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition font-medium"
                aria-label="Edit Consultant Profile"
                title="Edit Consultant Profile"
              >
                <PencilIcon className="w-5 h-5" />
                Edit Consultant Profile
              </button>
            </div>
          </div>

          {/* Tabs */}
          <CenterTabs active="consult" isConsultant={true} />

          {/* Message if not a consultant yet */}
          {!consultantActive && (
            <div className="mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm px-4 py-3">
              You haven’t set up a consultant profile yet. Click <b>Edit Consultant Profile</b> to add your details.
            </div>
          )}

          {/* Error */}
          {pageErr ? (
            <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-2">{pageErr}</div>
          ) : null}

          {/* Content */}
          <div className="px-6 pb-8 pt-4">
            {/* Overview */}
            <Section
              title="Overview"
              right={
                consultant?.primarySpecialization ? (
                  <span className="text-sm text-emerald-700 font-medium">
                    {consultant.primarySpecialization}
                  </span>
                ) : null
              }
            >
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {consultant?.bio ? consultant.bio : <span className="text-gray-500">No bio yet.</span>}
              </div>
            </Section>

            {/* Expertise & Experience */}
            <Section title="Expertise & Experience">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                <Detail label="Primary Specialization" value={consultant.primarySpecialization} />
                <div>
                  <dt className="font-medium text-emerald-900">Secondary Expertise</dt>
                  <dd className="mt-1"><Chips items={prettyList(consultant.secondaryExpertise)} /></dd>
                </div>
                <Detail label="Years of Experience" value={consultant.yearsOfExperience} />
                <Detail label="Highest Qualification" value={consultant.highestQualification} />
                <div>
                  <dt className="font-medium text-emerald-900">Certifications</dt>
                  <dd className="mt-1"><Chips items={prettyList(consultant.certifications)} /></dd>
                </div>
                <Detail label="Organization" value={consultant.organizationName} />
              </dl>
            </Section>

            {/* Services & Fees */}
            <Section title="Services & Fees">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                <div>
                  <dt className="font-medium text-emerald-900">Consultation Types</dt>
                  <dd className="mt-1"><Chips items={prettyList(consultant.consultationTypes)} /></dd>
                </div>
                <div>
                  <dt className="font-medium text-emerald-900">Available Services</dt>
                  <dd className="mt-1"><Chips items={prettyList(consultant.availableServices)} /></dd>
                </div>
                <Detail label="Fee Structure" value={consultant.feeStructure} />
              </dl>
            </Section>

            {/* Coverage & Languages */}
            <Section title="Coverage & Languages">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                <div>
                  <dt className="font-medium text-emerald-900">Service Regions</dt>
                  <dd className="mt-1"><Chips items={prettyList(consultant.serviceRegions)} /></dd>
                </div>
                <Detail label="Coverage Radius (km)" value={consultant.coverageRadiusKm} />
                <div>
                  <dt className="font-medium text-emerald-900">Languages</dt>
                  <dd className="mt-1"><Chips items={prettyList(consultant.languages)} /></dd>
                </div>
              </dl>
            </Section>

            {/* Availability */}
            <Section title="Availability">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                <div>
                  <dt className="font-medium text-emerald-900">Available Days</dt>
                  <dd className="mt-1"><Chips items={prettyList(consultant.availableDays)} /></dd>
                </div>
                <div>
                  <dt className="font-medium text-emerald-900">Time Slots</dt>
                  <dd className="mt-1"><Chips items={prettyList(consultant.availableTimeSlots)} /></dd>
                </div>
                <Detail label="Notice Period" value={consultant.noticePeriod} />
              </dl>
            </Section>

            {/* Social Links */}
            <Section title="Social Links">
              {prettyList(consultant.socialLinks) ? (
                <ul className="list-disc list-inside text-sm text-emerald-700">
                  {consultant.socialLinks.map((url, i) => (
                    <li key={i} className="truncate">
                      <a className="underline hover:no-underline" href={url} target="_blank" rel="noreferrer">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">No social links added.</div>
              )}
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
