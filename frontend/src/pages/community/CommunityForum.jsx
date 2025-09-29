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
  const [category, setCategory] = useState("All");
  const [selectedPostCategory, setSelectedPostCategory] = useState("General");

  const api = axios.create({ baseURL: BASE, timeout: 15000 });

  const categories = [
    "All",
    "Crop Issues",
    "Pest & Disease",
    "Irrigation & Soil",
    "Livestock",
    "Organic Farming",
    "Machinery & Tools",
    "General",
  ];

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
    setAllPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? { ...p, likes: updated.likes ?? p.likes, dislikes: updated.dislikes ?? p.dislikes }
          : p
      )
    );
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
        fd.append("category", selectedPostCategory);
        fd.append("image", file);
        res = await api.post("/community", fd, { headers });
      } else {
        res = await api.post(
          "/community",
          { title: t, comment: c, category: selectedPostCategory },
          { headers }
        );
      }

      setAllPosts((prev) => [res.data, ...prev]);
      setCategory(selectedPostCategory);
      setTitle("");
      setComment("");
      setFile(null);
      setSelectedPostCategory("General");
      setErrors({ title: "", comment: "", file: "" });
      setComposerOpen(false);
    } catch (err) {
      console.error("Create post failed:", err?.response || err);
      alert("Failed to create post: " + getErrMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  const posts = useMemo(() => {
    const sorted = sortByPopularity(allPosts);
    if (category === "All") return sorted;
    return sorted.filter((p) => p.category === category);
  }, [allPosts, category]);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
        <div className="text-emerald-700 font-medium text-lg">Loading community posts...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50/80 to-lime-50/60 relative overflow-hidden">
      <div className="relative z-10 container mx-auto lg:mx-0 px-3 lg:pl-6 lg:pr-0 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 max-w-7xl lg:mx-0">
          {/* Sidebar */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-lg p-6 h-fit sticky top-6 overflow-hidden relative">
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-emerald-800 tracking-tight">Categories</h2>
              </div>
              
              <ul className="space-y-1">
                {[
                  "All",
                  "Crop Issues",
                  "Pest & Disease",
                  "Irrigation & Soil",
                  "Livestock",
                  "Organic Farming",
                  "Machinery & Tools",
                  "General",
                ].map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => setCategory(cat)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group ${
                        category === cat
                          ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold shadow-md transform scale-[1.02]"
                          : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:translate-x-1"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{cat}</span>
                        {category === cat && (
                          <svg className="w-4 h-4 text-emerald-200" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Main Feed */}
          <div>
            <div className="text-center mb-10 relative">
              <div className="relative">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <h1 className="text-5xl font-black bg-gradient-to-r from-emerald-700 via-green-700 to-lime-700 bg-clip-text text-transparent tracking-tight">
                    Green Grow
                  </h1>
                </div>
                <div className="bg-gradient-to-r from-emerald-100 to-green-100 rounded-full px-6 py-2 inline-block border border-emerald-200 shadow-sm">
                  <p className="text-emerald-800 font-medium text-lg">🌱 Community Forum - Stories & Questions from Farmers 🌾</p>
                </div>
              </div>
            </div>

            {/* Composer */}
            {!composerOpen && (
              <div
                className="rounded-2xl border border-emerald-200 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl px-6 py-4 cursor-pointer transition-all duration-300 hover:transform hover:scale-[1.01] mb-6"
                onClick={() => setComposerOpen(true)}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                    </svg>
                  </div>
                  <input
                    readOnly
                    placeholder="🌱 What farming wisdom do you want to share or ask about?"
                    className="flex-1 rounded-full border-2 border-emerald-200 px-6 py-3 outline-none cursor-pointer bg-emerald-50/50 text-gray-700 placeholder-emerald-600/70 focus:border-emerald-400 transition-colors"
                  />
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {composerOpen && (
              <form
                onSubmit={handleNewPost}
                className="rounded-2xl border border-emerald-200 bg-white/95 backdrop-blur-sm p-6 shadow-xl space-y-4 mb-6 relative overflow-hidden"
              >
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-emerald-800">Create New Post</h3>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-emerald-700 mb-2">
                      📂 Select Category
                    </label>
                    <select
                      value={selectedPostCategory}
                      onChange={(e) => setSelectedPostCategory(e.target.value)}
                      className="w-full rounded-xl border-2 border-emerald-200 p-4 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all bg-white/80"
                    >
                      {categories.filter(cat => cat !== "All").map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    type="text"
                    className="w-full rounded-xl border-2 border-emerald-200 p-4 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all bg-white/80"
                    placeholder="🌱 What's your post about?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    aria-invalid={!!errors.title}
                  />
                  {errors.title && <p className="text-sm text-red-600 mt-1 pl-2">{errors.title}</p>}

                  <textarea
                    rows={4}
                    className="w-full rounded-xl border-2 border-emerald-200 p-4 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all mt-4 bg-white/80"
                    placeholder="🌾 Share your farming experience, ask questions, or tell your story..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    aria-invalid={!!errors.comment}
                  />
                  {errors.comment && <p className="text-sm text-red-600 mt-1 pl-2">{errors.comment}</p>}

                  <div className="flex items-center gap-3 mt-4">
                    <input
                      id="post-image"
                      type="file"
                      accept="image/*"
                      onChange={onPickFile}
                      className="hidden"
                    />
                    <label
                      htmlFor="post-image"
                      className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-200 px-4 py-3 cursor-pointer hover:bg-emerald-50 transition-all bg-white/80"
                      title="Attach a photo"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5 text-emerald-600"
                      >
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span className="text-sm font-medium text-emerald-700">📸 Add Photo</span>
                    </label>
                    {file && (
                      <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                        <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                        </svg>
                        <span className="text-sm text-emerald-700 truncate max-w-[200px]">
                          {file.name}
                        </span>
                      </div>
                    )}
                  </div>
                  {errors.file && <p className="text-sm text-red-600 mt-1 pl-2">{errors.file}</p>}

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setComposerOpen(false);
                        setTitle("");
                        setComment("");
                        setFile(null);
                        setSelectedPostCategory("General");
                        setErrors({ title: "", comment: "", file: "" });
                      }}
                      className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 disabled:hover:shadow-lg transition-all transform hover:scale-[1.02]"
                    >
                      {submitting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Posting...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          🌱 <span>Share Post</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
                    <svg className="w-10 h-10 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-emerald-800 mb-2">No posts in this category yet</h3>
                  <p className="text-emerald-600">Be the first to share your farming wisdom! 🌱</p>
                </div>
              ) : (
                posts.map((post) => (
                  <CommunityPostCard key={post._id} post={post} onReacted={handleReacted} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
