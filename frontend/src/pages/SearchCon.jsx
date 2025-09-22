// src/pages/SearchCon/SearchCon.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ConsultantCard from "../components/ConsultantCard";

// ---- If you already have a central api.js, you can use that instead
const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const CONSULT_API = `${BASE}/consultants`;

const TABS = { SEARCH: "search", BOOK: "book", PROFILE: "profile", MY: "my" };

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CATEGORY_OPTIONS = [
  "Crop Consultation",
  "Soil Testing",
  "Pest Control",
  "Irrigation Planning",
  "Organic Farming",
  "Livestock Consultation",
];
const CITY_OPTIONS = ["Colombo", "Kandy", "Galle", "Jaffna", "Negombo", "Kurunegala"];

export default function SearchCon() {
  const navigate = useNavigate();

  // ui state
  const [active, setActive] = useState(TABS.SEARCH);
  const [selected, setSelected] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // filters
  const [draft, setDraft] = useState({ category: "", city: "", q: "" });
  const [applied, setApplied] = useState({ category: "", city: "", q: "" });

  // data
  const [list, setList] = useState([]);     // consultants
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ESC closes preview
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setPreviewOpen(false);
    if (previewOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  // fetch from backend
  const fetchConsultants = async (filters) => {
    try {
      setLoading(true);
      setErr("");
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.city) params.city = filters.city;
      if (filters.q) params.q = filters.q;

      const { data } = await axios.get(CONSULT_API, { params });
      const items = Array.isArray(data) ? data : data?.items || [];
      setList(items);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchConsultants({});
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setDraft((p) => ({ ...p, [name]: value }));
  };

  const onSearch = () => {
    setApplied(draft);
    fetchConsultants(draft);
    setActive(TABS.SEARCH);
  };

  const onClear = () => {
    const empty = { category: "", city: "", q: "" };
    setDraft(empty);
    setApplied(empty);
    fetchConsultants(empty);
  };

  // redirect to Appointment.jsx with prefill data
  const goBook = (c) => {
    navigate("/appointment", {
      state: {
        person: {
          city: c.city,
          category: c.category,
          consultantId: c.id,
          consultantName: c.name,
        },
      },
      replace: false,
    });
  };

  const goProfile = (c) => {
    setSelected(c);
    setPreviewOpen(false);
    setActive(TABS.PROFILE);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const tabs = [
    { key: TABS.SEARCH, label: "Search Consultants", icon: SearchIcon },
    { key: TABS.BOOK, label: "Book Appointment", icon: CalendarIcon },
    { key: TABS.PROFILE, label: "Consultant Profile", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      

      {/* left tabs */}
      <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto z-30">
        <div className="p-6">
          <nav className="space-y-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => { setActive(t.key); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    isActive ? "bg-emerald-100 text-emerald-700 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* main */}
      <div className="md:pl-64">
        <main className="px-4 sm:px-6 lg:px-8 py-8">

          {/* SEARCH */}
          {active === TABS.SEARCH && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Find Expert Agricultural Consultants</h2>
                <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                  Real profiles loaded from your database.
                </p>
              </div>

              {/* filters */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Consultants</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization</label>
                    <select
                      name="category"
                      value={draft.category}
                      onChange={onChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">All Specializations</option>
                      {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <select
                      name="city"
                      value={draft.city}
                      onChange={onChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">All Cities</option>
                      {CITY_OPTIONS.map((ct) => <option key={ct} value={ct}>{ct}</option>)}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                    <input
                      name="q"
                      value={draft.q}
                      onChange={onChange}
                      placeholder="name / email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="md:col-span-4 flex items-end gap-3">
                    <button onClick={onSearch} className="bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 transition-colors">
                      Search
                    </button>
                    <button onClick={onClear} className="bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors">
                      Clear
                    </button>
                    {loading && <span className="text-sm text-gray-500">Loading…</span>}
                    {err && <span className="text-sm text-red-600">{err}</span>}
                  </div>
                </div>

                {(applied.category || applied.city || applied.q) && (
                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-sm text-emerald-700">
                    <span className="font-medium">Active filters:</span>{" "}
                    {applied.category && <span className="inline-block bg-emerald-100 px-2 py-1 rounded-full text-xs mr-2">{applied.category}</span>}
                    {applied.city && <span className="inline-block bg-emerald-100 px-2 py-1 rounded-full text-xs mr-2">{applied.city}</span>}
                    {applied.q && <span className="inline-block bg-emerald-100 px-2 py-1 rounded-full text-xs">{applied.q}</span>}
                  </div>
                )}
              </div>

              {/* results — NOW USING ConsultantCard component */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Available Consultants {list.length ? `(${list.length})` : ""}
                  </h3>
                </div>

                {list.length ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {list.map((c) => (
                      <ConsultantCard
                        key={c.id}
                        consultant={c}
                        onPreview={(cons) => {
                          setSelected(cons);
                          setPreviewOpen(true);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                    <div className="text-gray-400 mb-4"><SearchIcon /></div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No consultants found</h3>
                    <p className="text-gray-500 mb-4">Try adjusting your search filters</p>
                    <button onClick={onClear} className="text-emerald-600 hover:text-emerald-700 font-medium">Clear all filters</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROFILE (read-only view after user clicks Profile in popup) */}
          {active === TABS.PROFILE && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                {!selected ? (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Select a consultant from Search.</p>
                    <button onClick={() => setActive(TABS.SEARCH)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">Back to Search</button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{selected.name}</h2>
                    <div className="flex items-center gap-3 text-gray-600 mb-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
                        {selected.category}
                      </span>
                      <span className="flex items-center"><LocationIcon /><span className="ml-1">{selected.city}</span></span>
                      <span>{selected.yearsExp} yrs</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-6">{selected.about || "No bio"}</p>

                    {!!selected.specializations?.length && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2">Specializations</h4>
                        <div className="flex flex-wrap gap-2">
                          {selected.specializations.map((s, i) => (
                            <span key={i} className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={() => goBook(selected)} className="flex-1 bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700">Book Appointment</button>
                      <button onClick={() => setActive(TABS.SEARCH)} className="flex-1 bg-gray-100 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-200">Back to Search</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* PREVIEW POPUP (Profile | Book) */}
      {previewOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/30 backdrop-blur-sm" onClick={() => setPreviewOpen(false)}>
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 z-10" onClick={() => setPreviewOpen(false)} aria-label="Close">
              <XIcon />
            </button>

            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                  {selected.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{selected.name}</h3>
                  <p className="text-gray-600">{selected.category} • {selected.city} • {selected.yearsExp} years</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {selected.languages?.length ? (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Languages</h4>
                    <p className="text-gray-600">{selected.languages.join(", ")}</p>
                  </div>
                ) : null}
                {selected.about && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">About</h4>
                    <p className="text-gray-600">{selected.about}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => goBook(selected)} className="flex-1 bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700">
                  Book Appointment
                </button>
                <button onClick={() => goProfile(selected)} className="flex-1 bg-gray-100 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-200">
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
