// src/pages/community/CommunityPostCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const api = axios.create({ baseURL: BASE, timeout: 15000 });

/* --- auth helper --- */
const AUTH_KEYS = ["authToken", "token", "accessToken", "jwt"];
const auth = {
  token: () =>
    AUTH_KEYS.map((k) => localStorage.getItem(k) || sessionStorage.getItem(k))
      .find(Boolean) || null,
  isLoggedIn: () => !!auth.token(),
  name: () =>
    localStorage.getItem("userName") ||
    sessionStorage.getItem("userName") ||
    "Anonymous",
  avatar: () =>
    localStorage.getItem("userAvatar") ||
    sessionStorage.getItem("userAvatar") ||
    "",
};

const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() || "").join("");

const timeAgo = (d) => {
  const ts = new Date(d);
  if (isNaN(ts.getTime())) return "";
  const diff = (Date.now() - ts.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return ts.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function resolveImageUrl(img) {
  if (!img) return "";
  if (/^https?:\/\//i.test(img)) return img;
  const pathPart = img.startsWith("/uploads/") ? img : `/uploads/${img.replace(/^\/+/, "")}`;
  return `${BASE}${pathPart}`;
}

/* Icons */
const IconButton = ({ title, onClick, disabled, children }) => (
  <button type="button" title={title} onClick={onClick} disabled={disabled} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50">
    {children}
  </button>
);

const PencilIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
  </svg>
);

const TrashIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

export default function CommunityPostCard({ post, onReacted }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");

  const [likes, setLikes] = useState(post.likes || 0);
  const [dislikes, setDislikes] = useState(post.dislikes || 0);

  const iAmAuthor = (post.authorName || "Anonymous") === auth.name();

  const [editingPost, setEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editBody, setEditBody] = useState(post.comment || "");
  const [savingPost, setSavingPost] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [toast, setToast] = useState("");

  const storageKey = useMemo(() => `gg_react_${post._id}`, [post._id]);
  const [myReaction, setMyReaction] = useState(localStorage.getItem(storageKey) || "none");

  const whenLine = useMemo(() => timeAgo(post.createdAt), [post.createdAt]);

  // Prefer freshly-loaded comments count (full) over initial count on the post
  const commentCount = (full?.comments?.length ?? post.comments?.length ?? 0);

  /* Load comments once open */
  useEffect(() => {
    const fetchComments = async () => {
      if (!open || full) return;
      setCommentsLoading(true);
      try {
        const res = await api.get(`/community/${post._id}`);
        const comments = Array.isArray(res.data?.comments) ? res.data.comments : [];
        setFull({ comments });
      } catch (e) {
        console.error("Failed to load comments", e);
        alert("Failed to load comments");
      } finally {
        setCommentsLoading(false);
      }
    };
    fetchComments();
  }, [open, full, post._id]);

  /* Toggle Like / Unlike */
  const likeToggle = async () => {
    if (!auth.isLoggedIn()) {
      alert("Please log in to continue.");
      return;
    }
    try {
      if (myReaction === "like") {
        setLikes((n) => Math.max(0, n - 1));
        setMyReaction("none");
        localStorage.setItem(storageKey, "none");
        const res = await api.post(`/community/${post._id}/like/toggle`, { remove: true });
        setLikes(res.data.likes ?? 0);
        setDislikes(res.data.dislikes ?? 0);
        onReacted?.(post._id, res.data);
      } else if (myReaction === "dislike") {
        setDislikes((n) => Math.max(0, n - 1));
        setLikes((n) => n + 1);
        setMyReaction("like");
        localStorage.setItem(storageKey, "like");
        await api.post(`/community/${post._id}/dislike/toggle`, { remove: true });
        const res = await api.post(`/community/${post._id}/like/toggle`, { remove: false });
        setLikes(res.data.likes ?? 0);
        setDislikes(res.data.dislikes ?? 0);
        onReacted?.(post._id, res.data);
      } else {
        setLikes((n) => n + 1);
        setMyReaction("like");
        localStorage.setItem(storageKey, "like");
        const res = await api.post(`/community/${post._id}/like/toggle`, { remove: false });
        setLikes(res.data.likes ?? 0);
        setDislikes(res.data.dislikes ?? 0);
        onReacted?.(post._id, res.data);
      }
    } catch (e) {
      console.error("Like toggle failed", e);
      alert("Failed to update like");
    }
  };

  const dislikeToggle = async () => {
    if (!auth.isLoggedIn()) {
      alert("Please log in to continue.");
      return;
    }
    try {
      if (myReaction === "dislike") {
        setDislikes((n) => Math.max(0, n - 1));
        setMyReaction("none");
        localStorage.setItem(storageKey, "none");
        const res = await api.post(`/community/${post._id}/dislike/toggle`, { remove: true });
        setLikes(res.data.likes ?? 0);
        setDislikes(res.data.dislikes ?? 0);
        onReacted?.(post._id, res.data);
      } else if (myReaction === "like") {
        setLikes((n) => Math.max(0, n - 1));
        setDislikes((n) => n + 1);
        setMyReaction("dislike");
        localStorage.setItem(storageKey, "dislike");
        await api.post(`/community/${post._id}/like/toggle`, { remove: true });
        const res = await api.post(`/community/${post._id}/dislike/toggle`, { remove: false });
        setLikes(res.data.likes ?? 0);
        setDislikes(res.data.dislikes ?? 0);
        onReacted?.(post._id, res.data);
      } else {
        setDislikes((n) => n + 1);
        setMyReaction("dislike");
        localStorage.setItem(storageKey, "dislike");
        const res = await api.post(`/community/${post._id}/dislike/toggle`, { remove: false });
        setLikes(res.data.likes ?? 0);
        setDislikes(res.data.dislikes ?? 0);
        onReacted?.(post._id, res.data);
      }
    } catch (e) {
      console.error("Dislike toggle failed", e);
      alert("Failed to update unlike");
    }
  };

  /* Save edit */
  const savePost = async () => {
    if (!iAmAuthor) return;
    if (!editTitle.trim() || !editBody.trim()) {
      alert("Title and description required.");
      return;
    }
    setSavingPost(true);
    try {
      const headers = { "x-user-name": auth.name() };
      const tk = auth.token();
      if (tk) headers.Authorization = `Bearer ${tk}`;
      const res = await api.put(
        `/community/${post._id}`,
        { title: editTitle.trim(), comment: editBody.trim() },
        { headers }
      );
      post.title = res.data.title;
      post.comment = res.data.comment;
      setEditingPost(false);
    } catch (e) {
      console.error("Update failed", e);
      alert("Failed to update post");
    } finally {
      setSavingPost(false);
    }
  };

  /* Delete confirm + toast */
  const requestDelete = () => {
    if (!iAmAuthor) return;
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setDeletingPost(true);
    try {
      const headers = { "x-user-name": auth.name() };
      const tk = auth.token();
      if (tk) headers.Authorization = `Bearer ${tk}`;
      await api.delete(`/community/${post._id}`, { headers });
      post._deleted = true;
      setShowConfirm(false);
      setToast("Post deleted successfully");
      setTimeout(() => setToast(""), 2000);
    } catch (e) {
      console.error("Delete failed", e);
      alert("Failed to delete post");
    } finally {
      setDeletingPost(false);
    }
  };

  /* Share */
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/community/${post._id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.comment, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Post link copied to clipboard!");
      }
    } catch (e) {
      console.error("Share failed", e);
      alert("Unable to share");
    }
  };

  if (post._deleted) return null;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 top-6 z-[60] -translate-x-1/2 rounded-md bg-emerald-600 px-4 py-2 text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Delete confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[92%] max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800">Delete this post?</h3>
            <p className="mt-1 text-sm text-gray-600">This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowConfirm(false)} className="rounded-md border px-3 py-1.5 text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} disabled={deletingPost} className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-60">
                {deletingPost ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar name={post.authorName} src={post.authorAvatar} size="10" />
            <div>
              <h4 className="font-semibold text-gray-900">{post.authorName || "Anonymous"}</h4>
              <p className="mt-0.5 text-xs text-gray-500">{whenLine}</p>
            </div>
          </div>

          {iAmAuthor && (
            <div className="flex gap-1">
              <IconButton title={editingPost ? "Cancel edit" : "Edit post"} onClick={() => setEditingPost((s) => !s)}>
                <PencilIcon className="h-5 w-5 text-gray-600" />
              </IconButton>
              <IconButton title="Delete post" onClick={requestDelete} disabled={deletingPost}>
                <TrashIcon className="h-5 w-5 text-red-600" />
              </IconButton>
            </div>
          )}
        </div>

        {/* Content / Edit */}
        {!editingPost ? (
          <>
            <h2 className="mt-3 text-lg font-semibold text-gray-900">{post.title}</h2>
            <p className="mt-2 leading-relaxed text-gray-700">{post.comment}</p>
            {post.image && (
              <div className="mt-3">
                <img
                  src={resolveImageUrl(post.image)}
                  alt="post"
                  className="w-full max-h-[520px] rounded-xl border object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </div>
            )}
          </>
        ) : (
          <div className="mt-3 space-y-3">
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-lg border p-2" placeholder="Title" />
            <textarea rows={4} value={editBody} onChange={(e) => setEditBody(e.target.value)} className="w-full rounded-lg border p-2" placeholder="Description" />
            <div className="flex justify-end">
              <button onClick={savePost} disabled={savingPost} className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-60">
                {savingPost ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}

        {/* Actions (with live count on the comments button) */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-3 text-sm text-gray-700">
          <button onClick={likeToggle} className="rounded border bg-green-50 px-3 py-1 text-green-700 hover:bg-green-100">
            👍 Like <span className="ml-1">{likes}</span>
          </button>
          <button onClick={dislikeToggle} className="rounded border bg-green-50 px-3 py-1 text-green-700 hover:bg-green-100">
            👎 Unlike <span className="ml-1">{dislikes}</span>
          </button>

          {/* Always show count; toggle open/close on click */}
          <button
            onClick={() => setOpen((s) => !s)}
            className="rounded border bg-green-50 px-3 py-1 text-green-700 hover:bg-green-100"
          >
            💬 {open ? `Hide comments (${commentCount})` : `Comments (${commentCount})`}
          </button>

          <button onClick={handleShare} className="rounded border bg-green-50 px-3 py-1 text-green-700 hover:bg-green-100">
            ↗ Share
          </button>
        </div>

        {/* Comments */}
        {open && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <textarea
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Write your comment…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              onClick={async () => {
                if (!auth.isLoggedIn()) {
                  alert("Please log in to continue.");
                  return;
                }
                const text = newComment.trim();
                if (!text) return;

                const optimistic = {
                  _id: `tmp-${Date.now()}`,
                  authorName: auth.name(),
                  authorAvatar: auth.avatar(),
                  text,
                  createdAt: new Date().toISOString(),
                  replies: [],
                };

                // Optimistic add (immediately increases count)
                setFull((p) => ({ comments: [ ...(p?.comments || []), optimistic ] }));
                setNewComment("");

                try {
                  const res = await api.post(`/community/${post._id}/comments`, {
                    text,
                    authorAvatar: auth.avatar()
                  });
                  const saved = { ...res.data };
                  if (!saved.authorAvatar) saved.authorAvatar = optimistic.authorAvatar;

                  // Replace optimistic with actual saved one
                  setFull((p) => {
                    const arr = (p?.comments || []).map((c) => (c._id === optimistic._id ? saved : c));
                    return { comments: arr };
                  });

                  // Keep post.comments length in sync so count is correct even after closing
                  if (!Array.isArray(post.comments)) post.comments = [];
                  post.comments.push(saved);
                } catch (e) {
                  console.error("Failed to post comment", e);
                  // Revert optimistic add
                  setFull((p) => ({ comments: (p?.comments || []).filter((c) => c._id !== optimistic._id) }));
                  alert("Failed to post comment");
                }
              }}
              disabled={!newComment.trim()}
              className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Post Comment
            </button>

            {commentsLoading && <div className="mt-3 text-sm text-gray-500">Loading existing comments…</div>}

            <div className="mt-4 space-y-3">
              {(full?.comments || []).length === 0 ? (
                <p className="text-sm text-gray-500">No comments yet.</p>
              ) : (
                (full?.comments || []).map((c) => (
                  <div key={c._id} className="rounded-xl border bg-white p-3 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Avatar name={c.authorName} src={c.authorAvatar} size="9" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">
                          {c.authorName || "User"}
                          <span className="ml-2 text-xs text-gray-500">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-gray-700">{c.text}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* Avatar */
function Avatar({ name, src, size = "10" }) {
  if (src) {
    return <img src={src} alt={name || "avatar"} className={`h-${size} w-${size} rounded-full border bg-gray-100 object-cover`} />;
  }
  return (
    <div className={`h-${size} w-${size} rounded-full border bg-gray-200 text-sm font-semibold text-gray-700 flex items-center justify-center`} title={name}>
      {initials(name)}
    </div>
  );
}
