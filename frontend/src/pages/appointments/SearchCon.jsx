// src/pages/SearchCon/SearchCon.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import ConsultantCard from "../../components/ConsultantCard";

// ✅ Page loader (your existing component)
import Loader from "../../components/loader.jsx";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const CONSULT_API = `${BASE}/consultants`;

const TABS = { SEARCH: "search", PROFILE: "profile" };

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const CloseCircle = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2 2-2m0 4l-2-2-2-2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

/* ==== Filters ==== */
const CATEGORY_OPTIONS = [
  "Crop Consultation",
  "Soil Testing",
  "Pest Control",
  "Irrigation Planning",
  "Organic Farming",
  "Livestock Consultation",
];

const DISTRICTS = [
  "Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle","Gampaha","Hambantota",
  "Jaffna","Kalutara","Kandy","Kegalle","Kilinochchi","Kurunegala","Mannar","Matale",
  "Matara","Monaragala","Mullaitivu","Nuwara Eliya","Polonnaruwa","Puttalam","Ratnapura",
  "Trincomalee","Vavuniya",
];

const CITY_OPTIONS = DISTRICTS;

const CATEGORY_ALIASES = {
  soil: "Soil Testing",
  "soil testing": "Soil Testing",
  pest: "Pest Control",
  "pest control": "Pest Control",
  irrigation: "Irrigation Planning",
  organic: "Organic Farming",
  "organic farming": "Organic Farming",
  livestock: "Livestock Consultation",
  crop: "Crop Consultation",
  "crop consultation": "Crop Consultation",
};

const SUGGESTIONS = ["Kandy", "Colombo", "Soil Testing", "Pest Control", "Organic Farming"];
const MY_APPTS_ROUTE = "/my-appointments";

/* ==== Small skeleton (kept for fallback) ==== */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="h-4 w-24 rounded bg-emerald-100 animate-pulse mb-3" />
      <div className="h-5 w-48 rounded bg-gray-200 animate-pulse mb-2" />
      <div className="h-4 w-28 rounded bg-gray-100 animate-pulse mb-4" />
      <div className="h-4 w-full rounded bg-gray-100 animate-pulse mb-2" />
      <div className="h-4 w-4/5 rounded bg-gray-100 animate-pulse" />
    </div>
  );
}

const getToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token") ||
  localStorage.getItem("auth_token") ||
  sessionStorage.getItem("auth_token");

const requireLoginThen = (location, navigate, action) => {
  const token = getToken();
  if (token) return action();
  toast.error("Please log in to continue");
  navigate("/login", { replace: true, state: { from: location.pathname } });
};

export default function SearchCon() {
  const navigate = useNavigate();
  const location = useLocation();

  const [active, setActive] = useState(TABS.SEARCH);
  const [selected, setSelected] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);

  const [draft, setDraft] = useState({ q: "", category: "", city: "" });

  const [list, setList] = useState([]);
  const [, setLoading] = useState(false);     // true while fetching
  const [showLoader, setShowLoader] = useState(false); // true while we DISPLAY loader (min duration)
  const loaderStartRef = useRef(0);
  const MIN_LOADER_MS = 900;

  const [err, setErr] = useState("");

  // ---- helper to start/stop loader with minimum visible duration
  const startLoader = () => {
    loaderStartRef.current = Date.now();
    setLoading(true);
    setShowLoader(true);
  };
  const stopLoader = () => {
    const elapsed = Date.now() - loaderStartRef.current;
    const remain = Math.max(0, MIN_LOADER_MS - elapsed);
    setTimeout(() => {
      setLoading(false);
      setShowLoader(false);
    }, remain);
  };

  const fetchConsultants = async (filters) => {
    try {
      startLoader();
      setErr("");
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.city) params.city = filters.city;
      if (filters.q) params.q = String(filters.q).toLowerCase();
      const { data } = await axios.get(CONSULT_API, { params });
      const items = Array.isArray(data) ? data : data?.items || [];
      setList(items);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      stopLoader();
    }
  };

  // initial load
  useEffect(() => {
    fetchConsultants({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parseFromQ = (rawInput) => {
    const raw = (rawInput || "").trim();
    if (!raw) return { category: "", city: "", q: "" };
    const q = raw.toLowerCase();

    const cityExact = CITY_OPTIONS.find((c) => c.toLowerCase() === q);
    if (cityExact) return { category: "", city: cityExact, q: "" };

    const alias = CATEGORY_ALIASES[q];
    if (alias) return { category: alias, city: "", q: "" };

    const catExact = CATEGORY_OPTIONS.find((c) => c.toLowerCase() === q);
    if (catExact) return { category: catExact, city: "", q: "" };

    const catPrefix = CATEGORY_OPTIONS.find((c) => c.toLowerCase().startsWith(q));
    if (catPrefix) return { category: catPrefix, city: "", q: "" };

    return { category: "", city: "", q };
  };

  // debounce typing
  useEffect(() => {
    const h = setTimeout(() => {
      const parsed = parseFromQ(draft.q);
      const next = {
        category: draft.category || parsed.category,
        city: draft.city || parsed.city,
        q: !parsed.category && !parsed.city ? draft.q : "",
      };
      fetchConsultants(next);
    }, 200);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.q]);

  // react to dropdowns instantly
  useEffect(() => {
    const parsed = parseFromQ(draft.q);
    fetchConsultants({
      category: draft.category || parsed.category,
      city: draft.city || parsed.city,
      q: !parsed.category && !parsed.city ? draft.q : "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.category, draft.city]);

  const runSearchNow = () => {
    const parsed = parseFromQ(draft.q);
    fetchConsultants({
      category: draft.category || parsed.category,
      city: draft.city || parsed.city,
      q: !parsed.category && !parsed.city ? draft.q : "",
    });
  };

  /* ==== Actions ==== */
  const goBook = (c) => {
    requireLoginThen(location, navigate, () => {
      navigate("/appointment", {
        state: {
          person: {
            city: c.city,
            category: c.category,
            consultantId: c.id,
            consultantName: c.name,
          },
        },
      });
    });
  };

  const goProfile = (c) => {
    setSelected(c);
    setActive(TABS.PROFILE);
    setPopupOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openPopupFor = (c) => {
    setSelected(c);
    setPopupOpen(true);
  };

  const goMyAppointments = () => {
    requireLoginThen(location, navigate, () => {
      navigate(MY_APPTS_ROUTE);
    });
  };

  /* ---------- PAGE LOADER ---------- */
  if (showLoader) {
    return <Loader />; // Full-screen loader with min visible time
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top search header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            {/* Big search box */}
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600">
                <SearchIcon />
              </span>
              <input
                name="q"
                value={draft.q}
                onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && runSearchNow()}
                placeholder="Search by category, city, or name..."
                className="w-full rounded-full border-2 border-emerald-200 bg-white pl-11 pr-24 py-2.5 text-gray-800 placeholder-emerald-700/60 outline-none transition focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                aria-label="Search consultants"
              />
              {draft.q && (
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, q: "" }))}
                  className="absolute right-24 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  aria-label="Clear search"
                >
                  <CloseCircle />
                </button>
              )}
              <button
                onClick={runSearchNow}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-sm hover:bg-emerald-700"
              >
                Search
              </button>
            </div>

            {/* Category select */}
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              className="rounded-full border-2 border-emerald-200 bg-white px-3 py-2 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* City select */}
            <select
              value={draft.city}
              onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
              className="rounded-full border-2 border-emerald-200 bg-white px-3 py-2 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              aria-label="Filter by city"
            >
              <option value="">All Cities</option>
              {CITY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* My Appointments */}
            <button
              onClick={goMyAppointments}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-gray-900 text-white px-4 py-2 text-sm hover:bg-black"
            >
              My Appointments
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {active === TABS.SEARCH && (
          <div className="space-y-8">
            {/* Title */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Find Expert Agricultural Consultants
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                Real profiles loaded from your database.
              </p>
            </div>

            {err && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {err}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Available Consultants {list.length ? `(${list.length})` : ""}
                </h3>
              </div>

              {list.length ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {list.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => openPopupFor(c)}
                      className="text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
                      aria-label={`Open actions for ${c.name}`}
                    >
                      <ConsultantCard consultant={c} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <SearchIcon />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">No consultants found</h3>
                  <p className="text-gray-500 mt-1 mb-4">
                    Try another keyword or pick a suggestion below.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setDraft((d) => ({ ...d, q: s }))}
                        className="px-3 py-1.5 rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 text-sm transition-colors duration-200"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {active === TABS.PROFILE && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {!selected ? (
                <div className="text-center py-16 px-8">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                    <UserIcon />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No consultant selected
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Select a consultant from the search results to view their profile.
                  </p>
                  <button
                    onClick={() => setActive(TABS.SEARCH)}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors duration-200"
                  >
                    <SearchIcon />
                    <span className="ml-2">Back to Search</span>
                  </button>
                </div>
              ) : (
                <div className="p-8">
                  <div className="flex items-start gap-6 mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {(selected.name || "")
                        .split(" ")
                        .filter(Boolean)
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {selected.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 text-gray-600 mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
                          {selected.category}
                        </span>
                        <span className="flex items-center">
                          <LocationIcon />
                          <span className="ml-1">{selected.city}</span>
                        </span>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {selected.yearsExp} years experience
                        </span>
                      </div>
                    </div>
                  </div>

                  {selected.about && (
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">About</h4>
                      <p className="text-gray-700 leading-relaxed">{selected.about}</p>
                    </div>
                  )}

                  {!!selected.specializations?.length && (
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Specializations</h4>
                      <div className="flex flex-wrap gap-2">
                        {selected.specializations.map((s, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!!selected.languages?.length && (
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Languages</h4>
                      <p className="text-gray-700">{selected.languages.join(", ")}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => goBook(selected)}
                      className="flex-1 bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 transition-colors duration-200 font-medium"
                    >
                      Book Appointment
                    </button>
                    <button
                      onClick={() => setActive(TABS.SEARCH)}
                      className="flex-1 bg-gray-100 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                    >
                      Back to Search
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* POPUP (opens when card is clicked) */}
      {popupOpen && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setPopupOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">What do you want to do?</h3>
              <button
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                onClick={() => setPopupOpen(false)}
                aria-label="Close"
              >
                <XIcon />
              </button>
            </div>

            <div className="px-6 pt-5 pb-6">
              {/* Small identity row */}
              <div className="flex items-start gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-semibold">
                  {(selected.name || "")
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900">{selected.name}</div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      {selected.category}
                    </span>
                    <span className="flex items-center">
                      <LocationIcon />
                      <span className="ml-1">{selected.city}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Two big action buttons only */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => goBook(selected)}
                  className="flex-1 py-3 px-4 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
                >
                  Book Appointment
                </button>
                <button
                  onClick={() => goProfile(selected)}
                  className="flex-1 py-3 px-4 rounded-lg bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 transition"
                >
                  View Full Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
