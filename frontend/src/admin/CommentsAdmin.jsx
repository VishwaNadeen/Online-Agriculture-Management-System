// src/pages/Admin/CommentsAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BiTrash } from "react-icons/bi";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

function fmtDateTime(d) {
  const ts = new Date(d);
  if (isNaN(ts.getTime())) return "";
  return ts.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// robust URL resolver (absolute, data:, blob:, or /uploads)
function resolveImageUrl(img) {
  if (!img) return "";
  if (/^(https?:)?\/\/|^data:|^blob:/i.test(img)) return img;
  if (img.startsWith("/")) return `${BASE_URL}${img}`;
  const pathPart = img.startsWith("/uploads/")
    ? img
    : `/uploads/${img.replace(/^\/+/, "")}`;
  return `${BASE_URL}${pathPart}`;
}

// preview clamp helper
const preview = (s = "", n = 140) =>
  s.length > n ? s.slice(0, n).trimEnd() + "…" : s;

export default function CommentsAdmin() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(new Set()); // Track deleting comments
  const [expanded, setExpanded] = useState(() => new Set());
  const [q, setQ] = useState("");

  const loadComments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/community`);
      const all = [];
      (res.data || []).forEach((post) => {
        (post.comments || []).forEach((c) => {
          all.push({
            ...c,
            postId: post._id,
            postTitle: post.title,
            postCategory: post.category,
          });
        });
      });
      all.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setComments(all);
    } catch (e) {
      console.error("Failed to load comments", e);
      alert("Failed to load comments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, []);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteComment = async (postId, commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      setDeleting((prev) => new Set(prev).add(commentId));

      // Find the comment to get its authorName
      const comment = comments.find((c) => c._id === commentId);
      if (!comment) throw new Error("Comment not found in state");

      const response = await axios.delete(
        `${BASE_URL}/community/${postId}/comments/${commentId}`,
        {
          headers: {
            "x-user-name": comment.authorName || "Anonymous", // Use comment's authorName
          },
        }
      );

      if (response.status === 200 && response.data.ok) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setExpanded((prev) => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
        alert("Comment deleted successfully.");
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
      let errorMessage = "Failed to delete comment. Please try again.";
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = "Post or comment not found.";
        } else if (err.response.status === 403) {
          errorMessage = "You are not authorized to delete this comment.";
        } else if (err.response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage = err.response.data.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      alert(errorMessage);
    } finally {
      setDeleting((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return comments;
    return comments.filter((c) =>
      [c.text, c.authorName, c.postTitle, c.postCategory]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [comments, q]);

  if (loading) return <div className="text-gray-600 p-6">Loading comments...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">All Comments</h1>
        <button
          onClick={loadComments}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:brightness-105"
        >
          Refresh
        </button>
      </div>

      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by comment, name, title, or category…"
          className="w-full rounded-xl border-2 border-emerald-200 p-3 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 bg-white"
        />
      </div>

      {/* Header (table-like, not a <table>) */}
      <div className="rounded-2xl overflow-hidden border border-emerald-200 bg-white shadow">
        <div className="grid grid-cols-12 items-center bg-emerald-100/80 text-emerald-900 font-semibold px-4 py-3">
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Post Title</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-3">Comment</div>
          <div className="col-span-1 text-center">Action</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-emerald-100">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-gray-600">No comments found.</div>
          ) : (
            filtered.map((c) => {
              const isOpen = expanded.has(c._id);
              const isDeleting = deleting.has(c._id);
              const avatarRaw =
                c.authorAvatar ||
                c.userAvatar ||
                c.avatar ||
                c.photoURL ||
                c.picture ||
                c.image ||
                c.profilePic ||
                c.profilePicture ||
                "";
              const avatar = resolveImageUrl(avatarRaw);
              const name = c.authorName || "Anonymous";

              return (
                <div key={c._id} className="relative">
                  {/* Main row */}
                  <div className="grid grid-cols-12 gap-3 items-start px-4 py-4 hover:bg-emerald-50/40 transition-colors">
                    {/* Name */}
                    <div className="col-span-3 flex items-start gap-3">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt="avatar"
                          className="h-10 w-10 rounded-full border object-cover"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                          {name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="leading-tight">
                        <div className="font-semibold text-emerald-900">{name}</div>
                        {c.postCategory && (
                          <div className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {c.postCategory}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Post Title (clamped to 2 lines) */}
                    <div
                      className="col-span-3 text-gray-800"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                      title={c.postTitle}
                    >
                      {c.postTitle}
                    </div>

                    {/* Created */}
                    <div className="col-span-2 text-gray-700 whitespace-nowrap">
                      {fmtDateTime(c.createdAt)}
                    </div>

                    {/* Comment (always show 15 chars; click to expand below) */}
                    <div className="col-span-3 text-gray-800">
                      <button
                        onClick={() => toggleExpand(c._id)}
                        className="text-left w-full"
                        title={isOpen ? "Hide full comment" : "Show full comment"}
                      >
                        {preview(c.text, 15)}
                      </button>
                    </div>

                    {/* Action */}
                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        onClick={() => deleteComment(c.postId, c._id)}
                        className={`p-2 rounded-full text-red-600 ${
                          isDeleting
                            ? "bg-red-100 opacity-50 cursor-not-allowed"
                            : "bg-red-100 hover:bg-red-200"
                        }`}
                        title="Delete Comment"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <BiTrash className="text-lg" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail UNDER the row */}
                  {isOpen && (
                    <div className="px-4 pb-4 -mt-2">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-gray-900 whitespace-pre-wrap">
                        {c.text}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
