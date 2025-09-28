// src/pages/profile/ProfilePage.jsx
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
const prettyDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");
const valueOrDash = (v) => (v === null || v === undefined || v === "" ? "-" : String(v));

/* ---------------- icons ---------------- */
const PencilIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M16.862 3.487a1.75 1.75 0 0 1 2.476 2.476l-10.3 10.3a4 4 0 0 1-1.657.98l-3.11.889.889-3.11a4 4 0 0 1 .98-1.657l10.3-10.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const TrashIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4 7h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 3h6a1 1 0 0 1 1 1v3H8V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M18 7l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const EyeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const EyeOffIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10.58 10.58A3 3 0 0 0 12 15c.63 0 1.21-.2 1.68-.54M9.9 4.24A10.73 10.73 0 0 1 12 4c6.5 0 10 8 10 8a17.19 17.19 0 0 1-4.11 5.18M6.11 6.11A17.55 17.55 0 0 0 2 12s3.5 7 10 7c1.09 0 2.12-.18 3.08-.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/* ---------------- shared UI bits ---------------- */
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

/* ---------------- page ---------------- */
export default function ProfilePage() {
  const navigate = useNavigate();
  const [{ token, userId, cachedUser }, setAuth] = useState(() => readAuth());
  const [user, setUser] = useState(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [pageErr, setPageErr] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const clearAuthAndGoLogin = () => {
    ["auth_token","token","user_token","authToken","auth_user","userId"].forEach((k) => {
      localStorage.removeItem(k); sessionStorage.removeItem(k);
    });
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login");
  };

  const handleEdit = () => navigate("/profile/edit");
  const onRequestDelete = () => setShowDeleteModal(true);

  const onConfirmDelete = async (password) => {
    if (!user?._id || !token) return;
    try {
      setDeleting(true);
      const res = await fetch(`${BASE}/users/${user._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: password }),
      });
      if (!res.ok) {
        let msg = "";
        try { const j = await res.json(); msg = j?.message || j?.error || ""; } catch {}
        if (res.status === 401 || /password/i.test(msg)) toast.error("Wrong password");
        else toast.error(msg || `Delete failed (${res.status})`);
        return;
      }
      toast.success("Account deleted");
      setShowDeleteModal(false);
      clearAuthAndGoLogin();
    } finally {
      setDeleting(false);
    }
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
          <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700" onClick={() => navigate("/login")}>
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

  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User";
  const address = user.address || {};
  const addressText = useMemo(() => {
    return [address.line1, address.line2, address.city, address.stateProvince, address.country, address.postalCode]
      .filter(Boolean)
      .join(", ");
  }, [address.line1, address.line2, address.city, address.stateProvince, address.country, address.postalCode]);

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="relative bg-white border border-emerald-100 shadow-xl rounded-2xl overflow-hidden">
          {/* Banner */}
          <div className="h-36 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500" />

          {/* Avatar + Name (centered) */}
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

            {/* Edit button */}
            <div className="mt-3">
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition font-medium"
                aria-label="Edit Profile"
                title="Edit Profile"
              >
                <PencilIcon className="w-5 h-5" />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Centered tabs */}
          <CenterTabs active="profile" />

          {/* Errors */}
          {pageErr ? (
            <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-2">{pageErr}</div>
          ) : null}

          {/* Content */}
          <div className="px-6 pb-8 pt-4">
            {/* Basic details */}
            <Section title="Basic Details">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                <Detail label="Email" value={user.email} />
                <Detail label="Phone" value={user.phone} />
                <Detail label="Date of Birth" value={prettyDate(user.dateOfBirth)} />
                <Detail label="Gender" value={user.gender || "-"} />
                <Detail label="Username" value={user.username || user.userName || "-"} />
                <Detail label="Status" value={user.status || "Active"} />
              </dl>
            </Section>

            {/* Address section (separate) */}
            <Section title="Address">
              {addressText ? (
                <div className="text-sm text-gray-700 leading-relaxed">
                  {address.line1 && <div>{address.line1}</div>}
                  {address.line2 && <div>{address.line2}</div>}
                  <div>
                    {[address.city, address.stateProvince, address.postalCode].filter(Boolean).join(", ")}
                  </div>
                  <div>{address.country || ""}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No address provided.</div>
              )}
            </Section>

            {/* Danger zone */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-400 font-medium transition"
              >
                <TrashIcon className="w-5 h-5" />
                Delete Account
              </button>
            </div>
          </div>

          {/* Modal */}
          {showDeleteModal && (
            <DeleteConfirmModal
              loading={deleting}
              onCancel={() => !deleting && setShowDeleteModal(false)}
              onConfirm={onConfirmDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Delete Confirm Modal ---------------- */
function DeleteConfirmModal({ loading, onCancel, onConfirm }) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [localErr, setLocalErr] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setLocalErr("");
    if (!password.trim()) { setLocalErr("Password is required."); return; }
    onConfirm(password.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-emerald-900">Confirm Account Deletion</h3>
          <p className="text-sm text-gray-600 mt-1">Please enter your password to permanently delete your account.</p>
        </div>

        <form onSubmit={submit} className="px-5 py-4">
          <label className="block text-sm font-medium text-emerald-900 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              className="w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 pr-10"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-emerald-700"
              tabIndex={-1}
            >
              {showPw ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          {localErr ? (
            <p className="text-sm text-red-600 mt-2">{localErr}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-2">This action is irreversible. All your data will be removed.</p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-400 font-medium transition disabled:opacity-60">
              {loading ? (<><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></span>Deleting...</>) : (<><TrashIcon className="w-5 h-5" />Confirm Delete</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
