// RoleSelectModal.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const USERS_PATH = import.meta.env.VITE_USERS_PATH || "/api/users"; // change if your mount path differs

function readAuth() {
  try {
    const get = (k) => localStorage.getItem(k) ?? sessionStorage.getItem(k);
    const token =
      get("auth_token") ||
      get("token") ||
      get("user_token") ||
      get("authToken") ||
      "";
    const rawUser = get("auth_user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const userId = get("userId") || get("tempUserId") || user?._id || "";
    return { token, user, userId };
  } catch {
    return { token: "", user: null, userId: "" };
  }
}

async function patchRole({ userId, token, role }) {
  if (!userId || !token) return { ok: false, reason: "missing-auth" };
  try {
    const res = await fetch(`${BASE}${USERS_PATH}/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // NOTE: backend must allow `role` in updates (see section 2)
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, reason: err?.message || `HTTP ${res.status}` };
    }
    const updatedUser = await res.json();
    // sync role in storage so UI reflects immediately
    try {
      const raw = localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
      if (raw) {
        const cur = JSON.parse(raw);
        const next = { ...cur, role: updatedUser.role };
        localStorage.setItem("auth_user", JSON.stringify(next));
        sessionStorage.setItem("auth_user", JSON.stringify(next));
      }
    } catch {}
    return { ok: true, user: updatedUser };
  } catch (e) {
    return { ok: false, reason: e?.message || "network-error" };
  }
}

export default function RoleSelectModal({ open, onClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState("");
  const { token, userId } = readAuth();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handlePick = async (role, path) => {
    setLoading(role);
    // Try to update the role for logged-in users
    if (token && userId) {
      await patchRole({ userId, token, role }); // safe to ignore result; we still navigate
    }
    // Continue your current flow
    setTimeout(() => {
      onClose?.();
      navigate(`${path}?role=${role}`);
    }, 600);
  };

  const goFarmer = () => handlePick("farmer", "/register/farmer");
  const goConsultant = () => handlePick("consultant", "/register/consultant");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-fadeIn" onClick={onClose} />
      <div className="relative w-full max-w-md animate-slideUpAndScale">
        <div className="rounded-xl bg-white shadow-xl ring-1 ring-gray-200/50 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-lg font-semibold text-gray-900">Select Your Role</h3>
            <button onClick={onClose} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-gray-500 mb-6">
              Please choose your role to continue registration. You can add another role later if needed.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                disabled={loading === "farmer"}
                onClick={goFarmer}
                className="group relative w-full rounded-lg border border-gray-200 bg-white p-5 text-left transition-all 
                           hover:shadow-md hover:border-blue-300 hover:bg-blue-50/50 
                           disabled:cursor-not-allowed disabled:opacity-60
                           focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {loading === "farmer" ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="rounded-md bg-blue-100/50 p-2.5 text-xl text-blue-600">🌱</div>
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-blue-700">Farmer</div>
                      <div className="text-xs text-gray-500 mt-1 leading-tight">
                        Register with your farm details, location, and practices.
                      </div>
                    </div>
                  </div>
                )}
              </button>

              <button
                type="button"
                disabled={loading === "consultant"}
                onClick={goConsultant}
                className="group relative w-full rounded-lg border border-gray-200 bg-white p-5 text-left transition-all 
                           hover:shadow-md hover:border-blue-300 hover:bg-blue-50/50 
                           disabled:cursor-not-allowed disabled:opacity-60
                           focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {loading === "consultant" ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="rounded-md bg-blue-100/50 p-2.5 text-xl text-blue-600">🧑‍🔧</div>
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-blue-700">Consultant</div>
                      <div className="text-xs text-gray-500 mt-1 leading-tight">
                        Specify your expertise, services, and availability.
                      </div>
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end px-6 py-4 bg-gray-50/50 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 
                         hover:bg-gray-100 hover:text-gray-900 transition-colors
                         focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Inline animations (unchanged) */
const styles = `
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUpAndScale { from { transform: translateY(30px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
.animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
.animate-slideUpAndScale { animation: slideUpAndScale 0.4s ease-out forwards; }
`;
if (typeof document !== "undefined") {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = styles;
  document.head.appendChild(styleTag);
}
