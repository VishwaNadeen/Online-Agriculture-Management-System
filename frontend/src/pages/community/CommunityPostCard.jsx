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
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("");

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
  const pathPart = img.startsWith("/uploads/")
    ? img
    : `/uploads/${img.replace(/^\/+/, "")}`;
  return `${BASE}${pathPart}`;
}

/* Icons */
const IconButton = ({ title, onClick, disabled, children }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className="p-2 rounded-lg hover:bg-emerald-50 disabled:opacity-50 transition-all duration-200"
  >
    {children}
  </button>
);

const PencilIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
  </svg>
);

const TrashIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
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

  // --- REACTION (toggle/swap) ---
  const userScope = useMemo(() => (auth.name() || "Anonymous").trim(), []);
  const storageKey = useMemo(
    () => `gg_react_${post._id}_${userScope}`,
    [post._id, userScope]
  );
  const [myReaction, setMyReaction] = useState(
    localStorage.getItem(storageKey) || "none"
  );

  const whenLine = useMemo(() => timeAgo(post.createdAt), [post.createdAt]);

  const commentCount = full?.comments?.length ?? post.comments?.length ?? 0;

  /* Load comments once open */
  useEffect(() => {
    const fetchComments = async () => {
      if (!open || full) return;
      setCommentsLoading(true);
      try {
        const res = await api.get(`/community/${post._id}`);
        const comments = Array.isArray(res.data?.comments)
          ? res.data.comments
          : [];
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

  const react = async (type) => {
    if (!auth.isLoggedIn()) {
      alert("Please log in to continue.");
      return;
    }
    const headers = { "x-user-name": auth.name() };
    const tk = auth.token();
    if (tk) headers.Authorization = `Bearer ${tk}`;

    const prev = myReaction;

    const applyOptimistic = (next) => {
      if (prev === next) return;
      if (prev === "like") setLikes((n) => Math.max(0, n - 1));
      if (prev === "dislike") setDislikes((n) => Math.max(0, n - 1));
      if (next === "like") setLikes((n) => n + 1);
      if (next === "dislike") setDislikes((n) => n + 1);
      setMyReaction(next || "none");
      localStorage.setItem(storageKey, next || "none");
    };

    const target = prev === type ? "none" : type;
    applyOptimistic(target);

    try {
      const res = await api.post(`/community/${post._id}/${type}`, {}, { headers });
      setLikes(res.data.likes ?? 0);
      setDislikes(res.data.dislikes ?? 0);
      setMyReaction(res.data.myReaction || "none");
      localStorage.setItem(storageKey, res.data.myReaction || "none");
      onReacted?.(post._id, res.data);
    } catch (e) {
      console.error("Reaction failed", e);
      try {
        const s = await api.get(`/community/${post._id}`);
        setLikes(s.data.likes ?? 0);
        setDislikes(s.data.dislikes ?? 0);
      } catch {}
      setMyReaction(prev);
      localStorage.setItem(storageKey, prev);
      alert("Failed to update reaction");
    }
  };

  const likeToggle = () => react("like");
  const dislikeToggle = () => react("dislike");

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

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/community/${post._id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.comment,
          url: shareUrl,
        });
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

  const postAuthorAvatar =
    post.authorAvatar ||
    post.authorPhoto ||
    post.authorImage ||
    post.avatar ||
    post.profilePic ||
    "";

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 top-6 z-[60] -translate-x-1/2 rounded-xl bg-emerald-600 px-6 py-3 text-white shadow-lg border border-emerald-500">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            {toast}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[92%] max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-800">Delete Post?</h3>
            </div>
            <p className="text-gray-600 mb-6">This action cannot be undone. Your post will be permanently removed from the community.</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingPost}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60 transition-all"
              >
                {deletingPost ? "Deleting..." : "Delete Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-emerald-200 bg-white/95 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-[1.01] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-50/50 to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
        <div className="relative">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <Avatar name={post.authorName} src={postAuthorAvatar} size="12" />
            <div>
              <h4 className="font-bold text-emerald-800 text-lg">
                {post.authorName || "Anonymous"}
              </h4>
              <div className="flex items-center gap-2">
                <p className="text-emerald-600/80 text-sm font-medium">{whenLine}</p>
                {post.aiDetected && (
                  <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-medium border border-blue-200">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.5 2A1.5 1.5 0 0 0 8 3.5v1A1.5 1.5 0 0 0 9.5 6h1A1.5 1.5 0 0 0 12 4.5v-1A1.5 1.5 0 0 0 10.5 2h-1zM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                    </svg>
                    AI Categorized
                  </div>
                )}
              </div>
            </div>
          </div>

          {iAmAuthor && (
            <div className="flex gap-2">
              <IconButton
                title={editingPost ? "Cancel edit" : "Edit post"}
                onClick={() => setEditingPost((s) => !s)}
              >
                <PencilIcon className="h-5 w-5 text-emerald-600 hover:text-emerald-700" />
              </IconButton>
              <IconButton
                title="Delete post"
                onClick={requestDelete}
                disabled={deletingPost}
              >
                <TrashIcon className="h-5 w-5 text-red-500 hover:text-red-600" />
              </IconButton>
            </div>
          )}
        </div>

        {/* Content / Edit */}
        {!editingPost ? (
          <>
            <div className="mb-3 flex items-start gap-3">
              <h2 className="text-xl font-bold text-emerald-900 leading-tight">
                {post.title}
              </h2>
              {post.category && (
                <div className="flex items-center gap-1">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                    post.aiDetected 
                      ? "bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 text-blue-700"
                      : "bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-200 text-emerald-700"
                  }`}>
                    {post.aiDetected ? "🤖" : "🌱"} {post.category}
                  </span>
                  {post.aiDetected && (
                    <div className="group relative">
                      <svg className="w-4 h-4 text-blue-500 cursor-help" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                      </svg>
                      <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10">
                        Auto-categorized by AI
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="mb-4 leading-relaxed text-gray-800 text-lg">{post.comment}</p>
            {post.image && (
              <div className="mb-4">
                <img
                  src={resolveImageUrl(post.image)}
                  alt="post"
                  className="w-full max-h-[520px] rounded-xl border-2 border-emerald-200 object-cover shadow-md"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-xl border-2 border-emerald-200 p-4 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all bg-white"
              placeholder="Post title"
            />
            <textarea
              rows={4}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full rounded-xl border-2 border-emerald-200 p-4 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all bg-white"
              placeholder="Post description"
            />
            <div className="flex justify-end">
              <button
                onClick={savePost}
                disabled={savingPost}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold disabled:opacity-60 hover:shadow-lg transition-all transform hover:scale-[1.02]"
              >
                {savingPost ? "Saving..." : "💾 Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 border-t-2 border-emerald-100 pt-4 text-sm">
          <button
            onClick={likeToggle}
            className={`rounded-xl border-2 px-4 py-2 font-semibold transition-all transform hover:scale-105 ${
              myReaction === "like"
                ? "bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-400 text-white shadow-lg"
                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            👍 Like <span className="ml-1 font-bold">{likes}</span>
          </button>
          
          <button
            onClick={dislikeToggle}
            className={`rounded-xl border-2 px-4 py-2 font-semibold transition-all transform hover:scale-105 ${
              myReaction === "dislike"
                ? "bg-gradient-to-r from-red-500 to-red-600 border-red-400 text-white shadow-lg"
                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            👎 Unlike <span className="ml-1 font-bold">{dislikes}</span>
          </button>

          <button
            onClick={() => setOpen((s) => !s)}
            className="rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700 font-semibold hover:bg-emerald-100 transition-all transform hover:scale-105"
          >
            💬 {open ? `Hide comments (${commentCount})` : `Comments (${commentCount})`}
          </button>

          <button
            onClick={handleShare}
            className="rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700 font-semibold hover:bg-emerald-100 transition-all transform hover:scale-105"
          >
            🔗 Share
          </button>
        </div>

        {/* Comments */}
        {open && (
          <div className="mt-6 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/30 p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-16 h-16 bg-emerald-100/30 rounded-full transform -translate-x-4 -translate-y-4"></div>
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v3c0 .6.4 1 1 1 .2 0 .5-.1.7-.3L14.4 18H20c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                  </svg>
                </div>
                <h4 className="font-bold text-emerald-800">💬 Join the Discussion</h4>
              </div>

              <textarea
                rows={3}
                className="w-full rounded-xl border-2 border-emerald-200 bg-white p-4 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                placeholder="🌱 Share your thoughts or ask a question..."
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

                  setFull((p) => ({
                    comments: [...(p?.comments || []), optimistic],
                  }));
                  setNewComment("");

                  try {
                    const res = await api.post(
                      `/community/${post._id}/comments`,
                      {
                        text,
                        authorAvatar: auth.avatar(),
                      }
                    );
                    const saved = { ...res.data };
                    if (!saved.authorAvatar)
                      saved.authorAvatar = optimistic.authorAvatar;

                    setFull((p) => {
                      const arr = (p?.comments || []).map((c) =>
                        c._id === optimistic._id ? saved : c
                      );
                      return { comments: arr };
                    });

                    if (!Array.isArray(post.comments)) post.comments = [];
                    post.comments.push(saved);
                  } catch (e) {
                    console.error("Failed to post comment", e);
                    setFull((p) => ({
                      comments: (p?.comments || []).filter(
                        (c) => c._id !== optimistic._id
                      ),
                    }));
                    alert("Failed to post comment");
                  }
                }}
                disabled={!newComment.trim()}
                className="mt-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3 font-bold text-white hover:shadow-lg disabled:opacity-60 transition-all transform hover:scale-[1.02]"
              >
                🌱 Post Comment
              </button>

              {commentsLoading && (
                <div className="mt-4 flex items-center gap-2 text-emerald-700">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-600 border-t-transparent"></div>
                  <span className="text-sm font-medium">Loading comments...</span>
                </div>
              )}

              <div className="mt-6 space-y-4">
                {(full?.comments || []).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-3">
                      <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v3c0 .6.4 1 1 1 .2 0 .5-.1.7-.3L14.4 18H20c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                      </svg>
                    </div>
                    <p className="text-emerald-700 font-medium">No comments yet.</p>
                    <p className="text-emerald-600 text-sm">Be the first to join the conversation! 🌱</p>
                  </div>
                ) : (
                  (full?.comments || []).map((c) => {
                    const commentAvatar =
                      c.authorAvatar ||
                      c.authorPhoto ||
                      c.authorImage ||
                      c.avatar ||
                      c.profilePic ||
                      "";
                    return (
                      <div
                        key={c._id}
                        className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar
                            name={c.authorName}
                            src={commentAvatar}
                            size="10"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-emerald-800">
                                {c.authorName || "User"}
                              </span>
                              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                {timeAgo(c.createdAt)}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                              {c.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

/* Enhanced Avatar Component */
function Avatar({ name, src, size = "10" }) {
  const [broken, setBroken] = useState(false);
  const url = src ? resolveImageUrl(src) : "";

  const sizeClasses = {
    "9": "h-9 w-9 text-xs",
    "10": "h-10 w-10 text-sm",
    "12": "h-12 w-12 text-base"
  };

  if (url && !broken) {
    return (
      <img
        src={url}
        alt={name || "avatar"}
        className={`${sizeClasses[size] || sizeClasses["10"]} rounded-full border-2 border-emerald-200 bg-gray-100 object-cover shadow-md`}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div
      className={`${sizeClasses[size] || sizeClasses["10"]} rounded-full border-2 border-emerald-200 bg-gradient-to-br from-emerald-400 to-green-500 text-white font-bold flex items-center justify-center shadow-md`}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
