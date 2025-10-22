// CommunityForum.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import CommunityPostCard from "./CommunityPostCard";
import CategoriesSidebar from "./CategoriesSidebar"; 

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
    return (
      localStorage.getItem("userName") ||
      sessionStorage.getItem("userName") ||
      "User"
    );
  },
  avatar: () => {
    try {
      const s =
        localStorage.getItem("user") ||
        sessionStorage.getItem("user") ||
        localStorage.getItem("currentUser") ||
        sessionStorage.getItem("currentUser");
      if (s) {
        const u = JSON.parse(s);
        const pic =
          u.profilePicture ||
          u.avatar ||
          u.photoURL ||
          u.picture ||
          u.image ||
          u.photo ||
          u?.profile?.avatar ||
          "";
        if (pic) return pic;
      }
    } catch {}
    return (
      localStorage.getItem("userAvatar") ||
      sessionStorage.getItem("userAvatar") ||
      localStorage.getItem("profilePicture") ||
      sessionStorage.getItem("profilePicture") ||
      ""
    );
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

  const fileInputRef = useRef(null);

  const categories = [
    "All",
    "Crop Issues",
    "Pest & Disease",
    "Irrigation & Soil",
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
          ? {
              ...p,
              likes: updated.likes ?? p.likes,
              dislikes: updated.dislikes ?? p.dislikes,
            }
          : p
      )
    );
  };

  const handleDeleted = (postId) => {
    setAllPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  // ====== ONLY CHANGE: enforce 2 MB limit ======
  const onPickFile = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) {
      setFile(null);
      setErrors((x) => ({ ...x, file: "" }));
      return;
    }
    const okTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!okTypes.includes(f.type)) {
      setErrors((x) => ({
        ...x,
        file: "Please choose a JPG, PNG, WEBP or GIF.",
      }));
      e.target.value = "";
      setFile(null);
      return;
    }
    const maxMB = 2; // ← 2 MB limit
    if (f.size > maxMB * 1024 * 1024) {
      setErrors((x) => ({
        ...x,
        file: `Image must be ≤ ${maxMB} MB (your file is ${(f.size / (1024 * 1024)).toFixed(2)} MB).`,
      }));
      e.target.value = "";
      setFile(null);
      return;
    }
    setErrors((x) => ({ ...x, file: "" }));
    setFile(f);
  };
  // =============================================

  // allow letters, numbers, spaces and common punctuation
  const onlyLetters = (s) => /^[\p{L}\p{N}\s.,!?'()\-\u2013\u2014]+$/u.test(s);
  const startsWithNumber = /^\s*\d/;

  const t = title.trim();
  const c = comment.trim();
  const invalidTitleNow =
    (t.length > 0 && !onlyLetters(t)) || (t.length > 0 && startsWithNumber.test(t));
  const canShare = !!t && !!c && !invalidTitleNow && !errors.file && !submitting;

  // JSON if no image, FormData if image — NO custom headers that cause CORS preflight failures
  const handleNewPost = async (e) => {
    e.preventDefault();
    if (!auth.require()) return;

    const nextErr = {
      title: !t
        ? "Title is required."
        : startsWithNumber.test(t)
        ? "Title cannot start with a number."
        : !onlyLetters(t)
        ? "Title can include letters, numbers, spaces and basic punctuation."
        : "",
      comment: !c ? "Description is required." : "",
      file: errors.file || "",
    };
    setErrors(nextErr);
    if (nextErr.title || nextErr.comment || nextErr.file) return;

    try {
      setSubmitting(true);

      // Only include Authorization. Remove x-user-name/x-user-avatar to avoid preflight CORS issues.
      const headers = {};
      const token = auth.token();
      if (token) headers.Authorization = `Bearer ${token}`;

      let data;
      if (file) {
        data = new FormData();
        data.append("title", t);
        data.append("comment", c);
        data.append("category", selectedPostCategory);
        data.append("authorName", auth.name() || "User");
        const av = auth.avatar();
        if (av) data.append("authorAvatar", av);
        data.append("image", file);
      } else {
        data = {
          title: t,
          comment: c,
          category: selectedPostCategory,
          authorName: auth.name() || "User",
          authorAvatar: auth.avatar() || "",
        };
        headers["Content-Type"] = "application/json";
      }

      const res = await api.post("/community", data, { headers });

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

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
          <div className="text-emerald-700 font-medium text-lg">
            Loading community posts...
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50/80 to-lime-50/60 relative overflow-hidden">
      <div className="relative z-10 container mx-auto lg:mx-0 px-3 lg:pl-6 lg:pr-0 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 max-w-7xl lg:mx-0">
          {/* Sidebar (scrolls with page; not sticky) */}
          <CategoriesSidebar category={category} setCategory={setCategory} />

          {/* Main Feed (centered) */}
          <div className="flex flex-col items-center">
            {/* Header */}
            <div className="text-center mb-10 relative w-full max-w-3xl">
              <div className="relative">
                <div className="bg-gradient-to-r from-emerald-100 to-green-100 rounded-full px-6 py-2 inline-block border border-emerald-200 shadow-sm">
                  <p className="text-emerald-800 font-medium text-lg">
                    🌱 Community Forum - Questions from Farmers & Consultants🌾
                  </p>
                </div>
              </div>
            </div>

            {/* Composer launcher */}
            {!composerOpen && (
              <button
                type="button"
                className="w-full max-w-3xl text-left rounded-2xl border border-emerald-200 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl px-6 py-4 cursor-pointer transition-all duration-300 hover:transform hover:scale-[1.01] mb-6"
                onClick={() => setComposerOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setComposerOpen(true);
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
                    </svg>
                  </div>
                  <input
                    readOnly
                    placeholder="🌱 What farming wisdom do you want to share or ask about?"
                    className="flex-1 rounded-full border-2 border-emerald-200 px-6 py-3 outline-none cursor-pointer bg-emerald-50/50 text-gray-700 placeholder-emerald-600/70 focus:border-emerald-400 transition-colors"
                  />
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                    </svg>
                  </div>
                </div>
              </button>
            )}

            {/* Composer */}
            {composerOpen && (
              <form
                onSubmit={handleNewPost}
                className="w-full max-w-3xl rounded-2xl border border-emerald-200 bg-white/95 backdrop-blur-sm p-6 shadow-xl space-y-4 mb-6 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-emerald-800">Create a Post</h3>
                  <button
                    type="button"
                    onClick={() => setComposerOpen(false)}
                    className="px-3 py-1.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full rounded-xl border-2 border-emerald-200 p-4 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all bg-white"
                    />
                    {t.length > 0 && startsWithNumber.test(t) && (
                      <p className="text-red-600 text-sm mt-1">Title cannot start with a number.</p>
                    )}
                    {!startsWithNumber.test(t) && t.length > 0 && !onlyLetters(t) && (
                      <p className="text-red-600 text-sm mt-1">
                        Title can include letters, numbers, spaces and basic punctuation.
                      </p>
                    )}
                    {errors.title && !invalidTitleNow && (
                      <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <textarea
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Describe your question or share your experience..."
                      className="w-full rounded-xl border-2 border-emerald-200 p-4 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all bg-white"
                    />
                    {errors.comment && (
                      <p className="text-red-600 text-sm mt-1">{errors.comment}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-emerald-800 mb-1">
                        Category
                      </label>
                      <select
                        value={selectedPostCategory}
                        onChange={(e) => setSelectedPostCategory(e.target.value)}
                        className="w-full rounded-xl border-2 border-emerald-200 p-3 bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      >
                        {categories
                          .filter((c) => c !== "All")
                          .map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-emerald-800 mb-2">
                        Optional Image
                      </label>

                      <div className="flex items-center gap-3">
                        {/* Camera button triggers hidden input */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-700 font-medium hover:bg-emerald-100 transition"
                        >
                          {/* Camera icon */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-5 w-5"
                          >
                            <path d="M4 7a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3h-2.172a2 2 0 0 1-1.414-.586l-1.828-1.828A2 2 0 0 0 12.172 3h-0.344a2 2 0 0 0-1.414.586L8.586 5.586A2 2 0 0 1 7.172 6H5zM12 18a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
                          </svg>
                          Upload photo
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={onPickFile}
                          className="hidden"
                        />

                        {/* Show selected filename (optional) */}
                        {file?.name && (
                          <span className="text-sm text-emerald-700 truncate max-w-[12rem]">
                            {file.name}
                          </span>
                        )}
                      </div>

                      {errors.file && (
                        <p className="text-red-600 text-sm mt-1">{errors.file}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTitle("");
                      setComment("");
                      setFile(null);
                      setErrors({ title: "", comment: "", file: "" });
                      setSelectedPostCategory("General");
                      setComposerOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >    
                    Cancel  // Validation
                  </button>
                  <button
                    type="submit"
                    disabled={!canShare}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold disabled:opacity-60 hover:shadow-lg transform hover:scale-[1.02] transition-all"
                  >
                    {submitting ? "Posting..." : "🌱 Share Post"}
                  </button>
                </div>
              </form>
            )}

            {/* Posts */}
            <div className="w-full max-w-3xl space-y-6">
              {posts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
                    <svg
                      className="w-10 h-10 text-emerald-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-emerald-800 mb-2">
                    No posts in this category yet
                  </h3>
                  <p className="text-emerald-600">
                    Be the first to share your farming wisdom! 🌱
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <CommunityPostCard
                    key={post._id}
                    post={post}
                    onReacted={handleReacted}
                    onDeleted={handleDeleted}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
