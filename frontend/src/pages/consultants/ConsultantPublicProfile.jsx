// src/pages/consultants/ConsultantPublicProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function ConsultantPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Use state passed from navigation if available for instant render
  const navData = location.state?.consultant || null;
  const [data, setData] = useState(navData);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let abort = false;
    async function load() {
      try {
        setLoading(true);
        setErr("");
        const tryEndpoints = async () => {
          const attempts = [
            `${BASE}/consultants/${id}`,
            `${BASE}/consultants?id=${encodeURIComponent(id)}`,
            `${BASE}/users/${id}`,
          ];
          for (const url of attempts) {
            try {
              const res = await fetch(url);
              if (!res.ok) continue;
              const json = await res.json();
              const item = Array.isArray(json) ? json[0] : (json?.items?.[0] || json);
              if (item) return item;
            } catch {}
          }
          return null;
        };
        const fetched = await tryEndpoints();
        if (!abort && fetched) setData((prev) => prev || fetched);
      } catch (e) {
        if (!abort) {
          setErr(e.message || "Failed to load consultant profile");
          toast.error(e.message || "Failed to load consultant profile");
        }
      } finally {
        if (!abort) setLoading(false);
      }
    }
    if (id && !navData) {
      load();
    } else {
      setLoading(false);
    }
    return () => { abort = true; };
  }, [id, navData]);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl shadow p-6 text-center">
          <p className="text-red-600 font-medium mb-3">Consultant profile not found.</p>
          <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const name = data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim() || data.fullName || "Consultant";
  const avatar = data.avatar || `https://ui-avatars.com/api/?background=E6F4EA&color=166534&name=${encodeURIComponent(name)}`;
  const specs = Array.isArray(data.specializations) ? data.specializations : (data.specialization ? [data.specialization] : []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-white border border-emerald-100 shadow-xl rounded-2xl overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500" />

          {/* Header */}
          <div className="px-6 -mt-14 flex flex-col items-center text-center">
            <img src={avatar} alt="Profile" className="w-28 h-28 rounded-full ring-4 ring-white object-cover shadow-lg" />
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-900 tracking-tight">{name}</h1>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-700">
              {data.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {data.category}
                </span>
              )}
              {data.city && <span>{data.city}</span>}
              {data.yearsExp != null && <span>{data.yearsExp}+ yrs experience</span>}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-8 pt-4 space-y-6">
            <section>
              <h2 className="text-base sm:text-lg font-semibold text-emerald-900 mb-2">About</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {data.about || data.bio || "No bio provided."}
              </p>
            </section>

            <section>
              <h2 className="text-base sm:text-lg font-semibold text-emerald-900 mb-2">Specializations</h2>
              {specs.length ? (
                <div className="flex flex-wrap gap-2">
                  {specs.map((s, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">-</div>
              )}
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <div className="text-gray-500">Email</div>
                <div className="font-medium text-gray-800 break-words">{data.email || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Phone</div>
                <div className="font-medium text-gray-800 break-words">{data.phone || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Languages</div>
                <div className="font-medium text-gray-800 break-words">
                  {Array.isArray(data.languages) ? data.languages.join(", ") : (data.languages || "-")}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Organization</div>
                <div className="font-medium text-gray-800 break-words">{data.organization || data.organizationName || "-"}</div>
              </div>
            </section>

            <div className="pt-2">
              <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200">
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
