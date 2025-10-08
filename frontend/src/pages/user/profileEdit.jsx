// src/pages/profile/edit/UserEditPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/* ---------------- utils ---------------- */
function safeParse(json) { try { return JSON.parse(json); } catch { return null; } }
function readAuth() {
  const get = (k) => localStorage.getItem(k) ?? sessionStorage.getItem(k);
  const token = get("auth_token") || get("token") || get("user_token") || get("authToken") || "";
  const cachedUser = safeParse(get("auth_user"));
  const userId = (cachedUser?._id) || get("userId") || get("tempUserId") || "";
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

/* ---------------- page ---------------- */
export default function UserEditPage() {
  const navigate = useNavigate();
  const [{ token, userId, cachedUser }] = useState(() => readAuth());

  const [loading, setLoading] = useState(!cachedUser);
  const [saving, setSaving] = useState(false);
  const [pageErr, setPageErr] = useState("");

  const [form, setForm] = useState(() => ({
    firstName: valueOrEmpty(cachedUser?.firstName),
    lastName: valueOrEmpty(cachedUser?.lastName),
    email: valueOrEmpty(cachedUser?.email), // read-only
    phone: valueOrEmpty(cachedUser?.phone),
    dateOfBirth: cachedUser?.dateOfBirth ? cachedUser.dateOfBirth.substring(0,10) : "",
    gender: valueOrEmpty(cachedUser?.gender),
    address: {
      line1: valueOrEmpty(cachedUser?.address?.line1),
      line2: valueOrEmpty(cachedUser?.address?.line2),
      city: valueOrEmpty(cachedUser?.address?.city),
      stateProvince: valueOrEmpty(cachedUser?.address?.stateProvince),
      country: valueOrEmpty(cachedUser?.address?.country),
      postalCode: valueOrEmpty(cachedUser?.address?.postalCode),
    },
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

        setForm({
          firstName: valueOrEmpty(data.firstName),
          lastName: valueOrEmpty(data.lastName),
          email: valueOrEmpty(data.email),
          phone: valueOrEmpty(data.phone),
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.substring(0,10) : "",
          gender: valueOrEmpty(data.gender),
          address: {
            line1: valueOrEmpty(data?.address?.line1),
            line2: valueOrEmpty(data?.address?.line2),
            city: valueOrEmpty(data?.address?.city),
            stateProvince: valueOrEmpty(data?.address?.stateProvince),
            country: valueOrEmpty(data?.address?.country),
            postalCode: valueOrEmpty(data?.address?.postalCode),
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
     encodeURIComponent(`${form.firstName || ""} ${form.lastName || ""}`.trim() || "User"));

  const fullName = useMemo(
    () => `${form.firstName || ""} ${form.lastName || ""}`.trim() || "User",
    [form.firstName, form.lastName]
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

  const validate = () => {
    if (!form.firstName.trim()) return "First name is required.";
    if (!form.lastName.trim()) return "Last name is required.";
    if (!form.phone.trim()) return "Phone is required.";
    return "";
  };

  const onSave = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : null,
      gender: form.gender || null,
      address: form.address,
    };

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
      toast.success("User details updated");
      const raw = JSON.stringify(updated);
      localStorage.setItem("auth_user", raw);
      sessionStorage.setItem("auth_user", raw);
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/profile");
    } catch (e) {
      toast.error(e.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => navigate("/profile");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-emerald-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="relative bg-white border border-emerald-100 shadow-xl rounded-2xl overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500" />

          {/* Centered avatar + name (match profile design) */}
          <div className="px-6 -mt-14 flex flex-col items-center text-center">
            <img
              src={avatarSrc}
              alt="Avatar"
              className="w-28 h-28 rounded-full ring-4 ring-white object-cover shadow-lg"
            />
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-emerald-900">
              {fullName}
            </h1>
            {pageErr ? <p className="text-sm text-red-600 mt-1">{pageErr}</p> : null}
          </div>

          <form onSubmit={onSave} className="px-6 pb-6 pt-4">
            {/* Basic info */}
            <Fieldset title="Basic Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <TextInput label="First Name" value={form.firstName} onChange={(v)=>setField("firstName", v)} required />
                <TextInput label="Last Name" value={form.lastName} onChange={(v)=>setField("lastName", v)} required />
                <TextInput label="Email" type="email" value={form.email} onChange={() => {}} readOnly disabled />
                <TextInput label="Phone" value={form.phone} onChange={(v)=>setField("phone", v)} required />
                <TextInput label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v)=>setField("dateOfBirth", v)} />
                <TextInput label="Gender" placeholder="male / female / other" value={form.gender} onChange={(v)=>setField("gender", v)} />
              </div>
            </Fieldset>

            {/* Address */}
            <Fieldset title="Address">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <TextInput label="Line 1" value={form.address.line1} onChange={(v)=>setField("address.line1", v)} />
                <TextInput label="Line 2" value={form.address.line2} onChange={(v)=>setField("address.line2", v)} />
                <TextInput label="City" value={form.address.city} onChange={(v)=>setField("address.city", v)} />
                <TextInput label="State / Province" value={form.address.stateProvince} onChange={(v)=>setField("address.stateProvince", v)} />
                {/* Country dropdown fed from REST Countries (no hardcoding) */}
                <CountrySelect
                  label="Country"
                  value={form.address.country}
                  onChange={(v)=>setField("address.country", v)}
                />
                <TextInput label="Postal Code" value={form.address.postalCode} onChange={(v)=>setField("address.postalCode", v)} />
              </div>
            </Fieldset>

            {/* Actions */}
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
        // simple 24h cache
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

  // ensure current value appears even if not found (e.g., legacy free text)
  const hasValueInList = useMemo(
    () => countries.some((c) => c.name === value || c.code === value),
    [countries, value]
  );
  const normalizedValue = value;

  if (err) {
    // fallback to free-text input if API fails (still not hardcoding)
    return (
      <TextInput
        label={label}
        value={normalizedValue}
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
        className={
          "w-full rounded-lg border px-3 py-2 focus:outline-none border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        }
        aria-busy={loading ? "true" : "false"}
        value={
          hasValueInList
            ? normalizedValue
            : (normalizedValue ? `__custom__:${normalizedValue}` : "")
        }
        onChange={(e) => {
          const v = e.target.value.startsWith("__custom__:") ? e.target.value.slice(10) : e.target.value;
          onChange(v);
        }}
        disabled={loading}
      >
        <option value="">{loading ? "Loading countries..." : "Select a country"}</option>
        {/* current custom value if not in list */}
        {!hasValueInList && normalizedValue ? (
          <option value={`__custom__:${normalizedValue}`}>⚑ {normalizedValue}</option>
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
