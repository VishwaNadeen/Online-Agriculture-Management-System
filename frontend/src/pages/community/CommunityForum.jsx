// src/pages/community/CommunityForum.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CommunityPostCard from "./CommunityPostCard";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const AUTH_KEYS = ["authToken", "token", "accessToken", "jwt"];
const auth = {
  token: () =>
    AUTH_KEYS.map((k) => localStorage.getItem(k) || sessionStorage.getItem(k)).find(Boolean) ||
    null,
  isLoggedIn: () => !!auth.token(),
  name: () => {
    try {
      const s =
        localStorage.getItem("user") ||
        sessionStorage.getItem("user") ||
        localStorage.getItem("currentUser") ||
        sessionStorage.getItem("currentUser");
      if (s) {
        const u = JSON.parse(s);
        const first =
          u.firstName || u.first_name || u.given_name || u?.name?.first || "";
        const last =
          u.lastName || u.last_name || u.family_name || u?.name?.last || "";
        const full = `${first} ${last}`.trim();
        return (
          full ||
          u.name ||
          u.username ||
          (u.email && u.email.split("@")[0]) ||
          "User"
        );
      }
    } catch {}
    return localStorage.getItem("userName") ||
      sessionStorage.getItem("userName") ||
      "User";
  },
  require: () => {
    if (!auth.isLoggedIn()) {
      alert("Please log in to create a post.");
      return false;
    }
    return true;
  },
};

const getErrMsg = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  "Unknown error";

const sortByPopularity = (arr) =>
  [...arr].sort((a, b) => {
    const sb = (b.likes ?? 0) - (b.dislikes ?? 0);
    const sa = (a.likes ?? 0) - (a.dislikes ?? 0);
    if (sb !== sa) return sb - sa;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

export default function CommunityForum() {
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({ title: "", comment: "", file: "" });

  const api = axios.create({ baseURL: BASE, timeout: 15000 });

  const loadPosts = async () => {
    try {
      const res = await api.get("/community");
      setAllPosts(res.data || []);
    } catch (e) {
      console.error("[ERR] GET /community", e?.response || e);
      alert(`Failed to load posts: ${getErrMsg(e)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleReacted = (postId, updated) => {
    setAllPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, ...updated } : p)));
  };

  const onPickFile = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) {
      setFile(null);
      setErrors((x) => ({ ...x, file: "" }));
      return;
    }
    const okTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!okTypes.includes(f.type)) {
      setErrors((x) => ({ ...x, file: "Please choose a JPG, PNG, WEBP or GIF." }));
      e.target.value = "";
      setFile(null);
      return;
    }
    const maxMB = 5;
    if (f.size > maxMB * 1024 * 1024) {
      setErrors((x) => ({ ...x, file: `Image must be ≤ ${maxMB} MB.` }));
      e.target.value = "";
      setFile(null);
      return;
    }
    setErrors((x) => ({ ...x, file: "" }));
    setFile(f);
  };

  const handleNewPost = async (e) => {
    e.preventDefault();
    if (!auth.require()) return;

    const t = title.trim();
    const c = comment.trim();

    const nextErr = {
      title: t.length < 3 ? "Title must be at least 3 characters." : "",
      comment: c.length < 5 ? "Description must be at least 5 characters." : "",
      file: errors.file || "",
    };
    setErrors(nextErr);
    if (nextErr.title || nextErr.comment || nextErr.file) return;

    try {
      setSubmitting(true);

      const headers = {};
      const token = auth.token();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        headers["x-user-name"] = auth.name();
      }

      let res;
      if (file) {
        const fd = new FormData();
        fd.append("title", t);
        fd.append("comment", c);
        fd.append("image", file); // <- same field name
        res = await api.post("/community", fd, { headers });
      } else {
        res = await api.post(
          "/community",
          { title: t, comment: c },
          { headers }
        );
      }

      setAllPosts((prev) => [res.data, ...prev]);
      setTitle("");
      setComment("");
      setFile(null);
      setErrors({ title: "", comment: "", file: "" });
      setComposerOpen(false);
    } catch (err) {
      console.error("Create post failed:", err?.response || err);
      alert("Failed to create post: " + getErrMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  const posts = useMemo(() => sortByPopularity(allPosts), [allPosts]);

  if (loading) return <div className="w-full px-4 py-8 text-center">Loading posts...</div>;

  return (
    <div className="w-full flex justify-center px-4 py-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-700">Green Grow Community</h1>
          <p className="text-gray-600">Stories & questions from farmers</p>
        </div>

        {/* Composer trigger */}
        {!composerOpen && (
          <div
            className="rounded-2xl border bg-white shadow-sm px-4 py-3 cursor-pointer"
            onClick={() => setComposerOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-200" />
              <input
                readOnly
                placeholder="What do you want to ask or share?"
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 outline-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Composer */}
        {composerOpen && (
          <form
            onSubmit={handleNewPost}
            className="rounded-2xl border bg-white p-4 shadow-sm space-y-3 mt-4"
          >
            <input
              type="text"
              className="w-full rounded-lg border p-2"
              placeholder="Post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}

            <textarea
              rows={4}
              className="w-full rounded-lg border p-2"
              placeholder="Describe your question or story…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              aria-invalid={!!errors.comment}
            />
            {errors.comment && <p className="text-sm text-red-600">{errors.comment}</p>}

            {/* === Replaced plain file input with camera icon button === */}
            <div className="flex items-center gap-3">
              <input
                id="post-image"
                type="file"
                accept="image/*"
                onChange={onPickFile}
                className="hidden"
              />
              <label
                htmlFor="post-image"
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:bg-gray-50"
                title="Attach a photo"
              >
                {/* Camera icon (inline SVG) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span className="text-sm">Attach photo</span>
              </label>

              {/* show chosen file name (optional, read-only) */}
              {file && (
                <span className="text-sm text-gray-600 truncate max-w-[60%]">
                  {file.name}
                </span>
              )}
            </div>
            {errors.file && <p className="text-sm text-red-600">{errors.file}</p>}
            {/* === End of camera icon button === */}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setComposerOpen(false);
                  setTitle("");
                  setComment("");
                  setFile(null);
                  setErrors({ title: "", comment: "", file: "" });
                }}
                className="px-3 py-2 rounded-lg border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white"
              >
                {submitting ? "Posting…" : "Post"}
              </button>
            </div>
          </form>
        )}

        {/* Feed */}
        <div className="mt-6 space-y-4">
          {posts.length === 0 ? (
            <p className="text-gray-500 text-center">No posts yet.</p>
          ) : (
            posts.map((post) => (
              <CommunityPostCard key={post._id} post={post} onReacted={handleReacted} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
