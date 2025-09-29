// src/pages/profile/edit/FarmEditPage.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/* ---------------- utils ---------------- */
function safeParse(json) { try { return JSON.parse(json); } catch { return null; } }
function readAuth() {
  const get = (k) => localStorage.getItem(k) ?? sessionStorage.getItem(k);
  const token = get("auth_token") || get("token") || get("user_token") || get("authToken") || "";
  const cachedUser = safeParse(get("auth_user"));
  const userId = (cachedUser?._id) || get("userId") || "";
  return { token, userId, cachedUser };
}
const valueOrEmpty = (v) => (v == null ? "" : v);

/* ---------------- small icons ---------------- */
const ArrowLeft = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SaveIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M5 21h14a1 1 0 001-1V8.414a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0015.586 4H5a1 1 0 00-1 1v15a1 1 0 001 1z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 4v6h10" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const Crosshair = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/* ---------------- page ---------------- */
export default function FarmEditPage() {
  const navigate = useNavigate();
  const [{ token, userId, cachedUser }] = useState(() => readAuth());

  const [loading, setLoading] = useState(!cachedUser);
  const [saving, setSaving] = useState(false);
  const [pageErr, setPageErr] = useState("");

  const [form, setForm] = useState(() => ({
    farmer: {
      farmName: valueOrEmpty(cachedUser?.farmer?.farmName),
      farmType: valueOrEmpty(cachedUser?.farmer?.farmType),
      farmSize: valueOrEmpty(cachedUser?.farmer?.farmSize),
      farmSizeUnit: valueOrEmpty(cachedUser?.farmer?.farmSizeUnit),
      experienceYears: valueOrEmpty(cachedUser?.farmer?.experienceYears),
      primaryIrrigationMethod: valueOrEmpty(cachedUser?.farmer?.primaryIrrigationMethod),
      waterSource: valueOrEmpty(cachedUser?.farmer?.waterSource),
      fertilizerPractices: valueOrEmpty(cachedUser?.farmer?.fertilizerPractices),
      pesticideUsage: valueOrEmpty(cachedUser?.farmer?.pesticideUsage),
      soilType: valueOrEmpty(cachedUser?.farmer?.soilType),
      emergencyContact: valueOrEmpty(cachedUser?.farmer?.emergencyContact),
      sustainabilityPractices: Array.isArray(cachedUser?.farmer?.sustainabilityPractices) ? cachedUser.farmer.sustainabilityPractices : [],
      preferredConsultationTopics: Array.isArray(cachedUser?.farmer?.preferredConsultationTopics) ? cachedUser.farmer.preferredConsultationTopics : [],
      farmAddress: {
        line1: valueOrEmpty(cachedUser?.farmer?.farmAddress?.line1),
        line2: valueOrEmpty(cachedUser?.farmer?.farmAddress?.line2),
        city: valueOrEmpty(cachedUser?.farmer?.farmAddress?.city),
        stateProvince: valueOrEmpty(cachedUser?.farmer?.farmAddress?.stateProvince),
        country: valueOrEmpty(cachedUser?.farmer?.farmAddress?.country),
        postalCode: valueOrEmpty(cachedUser?.farmer?.farmAddress?.postalCode),
      },
      farmLocation: {
        lat: cachedUser?.farmer?.farmLocation?.lat ?? "",
        lng: cachedUser?.farmer?.farmLocation?.lng ?? "",
      },
    }
  }));

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
        if (abort) return;

        const f = data?.farmer || {};
        setForm({
          farmer: {
            farmName: valueOrEmpty(f.farmName),
            farmType: valueOrEmpty(f.farmType),
            farmSize: valueOrEmpty(f.farmSize),
            farmSizeUnit: valueOrEmpty(f.farmSizeUnit),
            experienceYears: valueOrEmpty(f.experienceYears),
            primaryIrrigationMethod: valueOrEmpty(f.primaryIrrigationMethod),
            waterSource: valueOrEmpty(f.waterSource),
            fertilizerPractices: valueOrEmpty(f.fertilizerPractices),
            pesticideUsage: valueOrEmpty(f.pesticideUsage),
            soilType: valueOrEmpty(f.soilType),
            emergencyContact: valueOrEmpty(f.emergencyContact),
            sustainabilityPractices: Array.isArray(f.sustainabilityPractices) ? f.sustainabilityPractices : [],
            preferredConsultationTopics: Array.isArray(f.preferredConsultationTopics) ? f.preferredConsultationTopics : [],
            farmAddress: {
              line1: valueOrEmpty(f?.farmAddress?.line1),
              line2: valueOrEmpty(f?.farmAddress?.line2),
              city: valueOrEmpty(f?.farmAddress?.city),
              stateProvince: valueOrEmpty(f?.farmAddress?.stateProvince),
              country: valueOrEmpty(f?.farmAddress?.country),
              postalCode: valueOrEmpty(f?.farmAddress?.postalCode),
            },
            farmLocation: {
              lat: f?.farmLocation?.lat ?? "",
              lng: f?.farmLocation?.lng ?? "",
            },
          },
        });

        const raw = JSON.stringify(data);
        localStorage.setItem("auth_user", raw);
        sessionStorage.setItem("auth_user", raw);
        window.dispatchEvent(new Event("auth-changed"));
      } catch (e) {
        if (!abort) setPageErr(e.message || "Failed to load profile");
      } finally {
        if (!abort) setLoading(false);
      }
    }
    fetchUser();
    return () => { abort = true; };
  }, [userId, token, navigate]);

  const avatarSrc =
    (cachedUser?.profilePicture ||
     "https://ui-avatars.com/api/?background=E6F4EA&color=166534&name=" +
     encodeURIComponent(`${cachedUser?.firstName || ""} ${cachedUser?.lastName || ""}`.trim() || "User"));

  const fullName = useMemo(
    () => `${cachedUser?.firstName || ""} ${cachedUser?.lastName || ""}`.trim() || "User",
    [cachedUser?.firstName, cachedUser?.lastName]
  );

  const setField = (path, value) => {
    setForm((f) => {
      const copy = structuredClone(f);
      const parts = path.split(".");
      let cur = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (cur[p] == null || typeof cur[p] !== "object") cur[p] = {};
        cur = cur[p];
      }
      cur[parts[parts.length - 1]] = value;
      return copy;
    });
  };
  const onCSVListChange = (path, str) => {
    const arr = str.split(",").map(s => s.trim()).filter(Boolean);
    setField(path, arr);
  };
  const csv = (arr) => Array.isArray(arr) ? arr.join(", ") : "";

  const onSave = async (e) => {
    e.preventDefault();
    const payload = { farmer: form.farmer };

    try {
      setSaving(true);
      const res = await fetch(`${BASE}/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = `Save failed (${res.status})`;
        try { const j = await res.json(); msg = j?.message || msg; } catch {}
        toast.error(msg);
        return;
      }
      const updated = await res.json();
      toast.success("Farm details updated");
      const raw = JSON.stringify(updated);
      localStorage.setItem("auth_user", raw);
      sessionStorage.setItem("auth_user", raw);
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/profile/farm");
    } catch (e) {
      toast.error(e.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => navigate("/profile/farm");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-emerald-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const f = form.farmer;
  const addr = f.farmAddress;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="relative bg-white border border-emerald-100 shadow-xl rounded-2xl overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500" />

          {/* Centered avatar + name */}
          <div className="px-6 -mt-14 flex flex-col items-center text-center">
            <img src={avatarSrc} alt="Avatar" className="w-28 h-28 rounded-full ring-4 ring-white object-cover shadow-lg" />
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-emerald-900">{fullName}</h1>
            {pageErr ? <p className="text-sm text-red-600 mt-1">{pageErr}</p> : null}
          </div>

          <form onSubmit={onSave} className="px-6 pb-6 pt-4">
            <Fieldset title="Farm Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <TextInput label="Farm Name" value={f.farmName} onChange={(v)=>setField("farmer.farmName", v)} />
                <TextInput label="Farm Type" value={f.farmType} onChange={(v)=>setField("farmer.farmType", v)} />
                <TextInput label="Farm Size" type="number" value={f.farmSize} onChange={(v)=>setField("farmer.farmSize", v)} />
                <TextInput label="Farm Size Unit" placeholder="acres / hectares" value={f.farmSizeUnit} onChange={(v)=>setField("farmer.farmSizeUnit", v)} />
                <TextInput label="Experience (years)" type="number" value={f.experienceYears} onChange={(v)=>setField("farmer.experienceYears", v)} />
                <TextInput label="Irrigation Method" value={f.primaryIrrigationMethod} onChange={(v)=>setField("farmer.primaryIrrigationMethod", v)} />
                <TextInput label="Water Source" value={f.waterSource} onChange={(v)=>setField("farmer.waterSource", v)} />
                <TextInput label="Soil Type" value={f.soilType} onChange={(v)=>setField("farmer.soilType", v)} />
                <TextInput label="Pesticide Usage" value={f.pesticideUsage} onChange={(v)=>setField("farmer.pesticideUsage", v)} />
                <TextInput label="Fertilizer Practices" value={f.fertilizerPractices} onChange={(v)=>setField("farmer.fertilizerPractices", v)} />
                <TextInput label="Emergency Contact" value={f.emergencyContact} onChange={(v)=>setField("farmer.emergencyContact", v)} />
              </div>
            </Fieldset>

            <Fieldset title="Practices & Preferences">
              <div className="grid grid-cols-1 gap-4">
                <TextInput label="Sustainability Practices (comma separated)" value={csv(f.sustainabilityPractices)} onChange={(v)=>onCSVListChange("farmer.sustainabilityPractices", v)} />
                <TextInput label="Preferred Consultation Topics (comma separated)" value={csv(f.preferredConsultationTopics)} onChange={(v)=>onCSVListChange("farmer.preferredConsultationTopics", v)} />
              </div>
            </Fieldset>

            <Fieldset title="Farm Address">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <TextInput label="Line 1" value={addr.line1} onChange={(v)=>setField("farmer.farmAddress.line1", v)} />
                <TextInput label="Line 2" value={addr.line2} onChange={(v)=>setField("farmer.farmAddress.line2", v)} />
                <TextInput label="City" value={addr.city} onChange={(v)=>setField("farmer.farmAddress.city", v)} />
                <TextInput label="State / Province" value={addr.stateProvince} onChange={(v)=>setField("farmer.farmAddress.stateProvince", v)} />
                {/* Country dropdown (REST Countries, cached) */}
                <CountrySelect
                  label="Country"
                  value={addr.country}
                  onChange={(v)=>setField("farmer.farmAddress.country", v)}
                />
                <TextInput label="Postal Code" value={addr.postalCode} onChange={(v)=>setField("farmer.farmAddress.postalCode", v)} />
              </div>
            </Fieldset>

            <Fieldset title="Farm Location">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <TextInput label="Latitude" type="number" step="any" value={f.farmLocation.lat} onChange={(v)=>setField("farmer.farmLocation.lat", v)} />
                <div className="flex gap-2">
                  <TextInput label="Longitude" type="number" step="any" value={f.farmLocation.lng} onChange={(v)=>setField("farmer.farmLocation.lng", v)} className="flex-1" />
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) return toast.error("Geolocation not supported");
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          const { latitude, longitude } = pos.coords;
                          setField("farmer.farmLocation.lat", latitude);
                          setField("farmer.farmLocation.lng", longitude);
                        },
                        () => toast.error("Unable to fetch your location")
                      );
                    }}
                    className="self-end h-[42px] px-3 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    title="Use my location"
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-medium">
                      <Crosshair className="w-4 h-4" /> Use my location
                    </span>
                  </button>
                </div>
              </div>

              {/* Interactive map picker (Leaflet via CDN) */}
              <div className="mt-4">
                <MapPicker
                  value={f.farmLocation}
                  onChange={(loc) => {
                    setField("farmer.farmLocation.lat", loc.lat);
                    setField("farmer.farmLocation.lng", loc.lng);
                  }}
                />
              </div>
            </Fieldset>

            <div className="mt-6 flex items-center justify-between">
              <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50">
                <ArrowLeft className="w-5 h-5" /> Cancel
              </button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60">
                {saving ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <SaveIcon className="w-5 h-5" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Country Dropdown (no hardcoded list) ---------------- */
/** Uses REST Countries:
 *  https://restcountries.com/v3.1/all?fields=name,cca2
 *  Caches results in localStorage for 24h to reduce requests.
 */
function CountrySelect({ label, value, onChange }) {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let abort = false;
    async function load() {
      try {
        setLoading(true);
        setErr("");
        const cacheKey = "countries_cache_v3";
        const cached = safeParse(localStorage.getItem(cacheKey));
        const now = Date.now();
        if (cached && Array.isArray(cached.items) && now - cached.ts < 24 * 60 * 60 * 1000) {
          if (!abort) setCountries(cached.items);
        } else {
          const res = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2");
          if (!res.ok) throw new Error(`Countries fetch failed (${res.status})`);
          const data = await res.json();
          const items = (Array.isArray(data) ? data : [])
            .map((r) => ({ code: r.cca2, name: r?.name?.common || "" }))
            .filter((r) => r.name)
            .sort((a, b) => a.name.localeCompare(b.name));
          if (!abort) {
            setCountries(items);
            localStorage.setItem(cacheKey, JSON.stringify({ ts: now, items }));
          }
        }
      } catch (e) {
        if (!abort) setErr(e.message || "Failed to load countries");
      } finally {
        if (!abort) setLoading(false);
      }
    }
    load();
    return () => { abort = true; };
  }, []);

  const hasValueInList = useMemo(
    () => countries.some((c) => c.name === value || c.code === value),
    [countries, value]
  );

  if (err) {
    return (
      <TextInput
        label={label}
        value={value}
        onChange={onChange}
        placeholder="Type your country"
      />
    );
  }

  return (
    <label className="block">
      <span className="block text-sm font-medium text-emerald-900 mb-1">
        {label}
      </span>
      <select
        className="w-full rounded-lg border px-3 py-2 focus:outline-none border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        aria-busy={loading ? "true" : "false"}
        value={hasValueInList ? value : (value ? `__custom__:${value}` : "")}
        onChange={(e) => {
          const v = e.target.value.startsWith("__custom__:") ? e.target.value.slice(10) : e.target.value;
          onChange(v);
        }}
        disabled={loading}
      >
        <option value="">{loading ? "Loading countries..." : "Select a country"}</option>
        {!hasValueInList && value ? (
          <option value={`__custom__:${value}`}>⚑ {value}</option>
        ) : null}
        {countries.map((c) => (
          <option key={c.code} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      {loading ? <p className="text-xs text-gray-500 mt-1">Fetching countries…</p> : null}
    </label>
  );
}

/* ---------------- Map Picker (Leaflet via CDN, click to set) ---------------- */
function MapPicker({ value, onChange }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);
  const [failed, setFailed] = useState(false);

  const lat = parseFloat(value?.lat);
  const lng = parseFloat(value?.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaflet() {
      if (typeof window === "undefined") return;
      if (window.L) return window.L;

      // inject CSS
      if (!document.getElementById("leaflet-css-cdn")) {
        const link = document.createElement("link");
        link.id = "leaflet-css-cdn";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      // inject JS
      if (!document.getElementById("leaflet-js-cdn")) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.id = "leaflet-js-cdn";
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
      return window.L;
    }

    (async () => {
      try {
        const L = await loadLeaflet();
        if (cancelled || !mapRef.current || !L) return;

        // Init map
        const start = hasCoords ? [lat, lng] : [7.8731, 80.7718]; // default: Sri Lanka center-ish
        const zoom = hasCoords ? 13 : 7;
        leafletMap.current = L.map(mapRef.current).setView(start, zoom);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(leafletMap.current);

        // Marker
        markerRef.current = L.marker(start, { draggable: true }).addTo(leafletMap.current);
        markerRef.current.on("dragend", (e) => {
          const m = e.target.getLatLng();
          onChange({ lat: +m.lat.toFixed(6), lng: +m.lng.toFixed(6) });
        });

        // Click to set
        leafletMap.current.on("click", (e) => {
          const { lat: clat, lng: clng } = e.latlng;
          markerRef.current.setLatLng([clat, clng]);
          onChange({ lat: +clat.toFixed(6), lng: +clng.toFixed(6) });
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      try {
        if (leafletMap.current) {
          leafletMap.current.remove();
          leafletMap.current = null;
          markerRef.current = null;
        }
      } catch {}
    };
  }, []); // init once

  // keep marker in sync if inputs change outside the map
  useEffect(() => {
    if (leafletMap.current && markerRef.current && hasCoords) {
      markerRef.current.setLatLng([lat, lng]);
      leafletMap.current.setView([lat, lng]);
    }
  }, [lat, lng, hasCoords]);

  if (failed) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 p-3 text-sm">
        Map failed to load. You can still enter latitude and longitude manually above.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={mapRef} className="w-full h-72 rounded-xl border border-emerald-200 overflow-hidden" />
      <p className="text-xs text-gray-600">
        Tip: Click anywhere on the map or drag the pin to set your farm location.
      </p>
    </div>
  );
}

/* ---------------- UI primitives ---------------- */
function Fieldset({ title, children }) {
  return (
    <section className="mb-6 rounded-xl border border-emerald-100/70 bg-gradient-to-b from-white to-emerald-50/20 p-5 shadow-sm">
      <h2 className="text-base sm:text-lg font-semibold text-emerald-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}
function TextInput({ label, value, onChange, type="text", className="", required=false, placeholder, step, readOnly=false, disabled=false }) {
  return (
    <label className={"block " + className}>
      <span className="block text-sm font-medium text-emerald-900 mb-1">
        {label}{required && <span className="text-red-600"> *</span>}
      </span>
      <input
        type={type}
        step={step}
        value={value ?? ""}
        onChange={(e) => !disabled && !readOnly && onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        disabled={disabled}
        className={
          "w-full rounded-lg border px-3 py-2 focus:outline-none " +
          (disabled || readOnly
            ? "bg-gray-100 text-gray-500 border-gray-300"
            : "border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500")
        }
      />
    </label>
  );
}
