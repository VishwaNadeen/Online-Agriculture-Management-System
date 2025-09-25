// src/pages/community/CommunityPostCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StarRating from "../../components/StarRating.jsx"; // ← adjust if your casing/path differs

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function CommunityPostCard({ post, onUpvoted }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [full, setFull] = useState(null);
  const [newComment, setNewComment] = useState("");

  const [likes, setLikes] = useState(typeof post.likes === "number" ? post.likes : 0);
  const [postRating, setPostRating] = useState(post.rating || 0);

  const createdLine = useMemo(() => {
    const when = post.createdAt
      ? new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "";
    const tag = post.tagline || post.category || "Member";
    return `${tag} • ${when}`;
  }, [post]);

  // fetch details (with comments) on first open
  useEffect(() => {
    const fetchFull = async () => {
      if (!open || full) return;
      setLoading(true);
      try {
        const res = await axios.get(`${BASE}/community/${post._id}`);
        setFull(res.data);
        if (typeof res.data?.rating === "number") setPostRating(res.data.rating);
        if (typeof res.data?.likes === "number") setLikes(res.data.likes);
      } catch (e) {
        console.error(e);
        alert("Failed to load comments");
      } finally {
        setLoading(false);
      }
    };
    fetchFull();
  }, [open, full, post._id]);

  const onFollow = () => {
    alert(`Followed ${post.authorName || "this user"} (demo)`);
  };

  // Save post rating
  const ratePost = async (r) => {
    setPostRating(r); // optimistic
    try {
      await axios.put(`${BASE}/community/${post._id}`, { rating: r });
    } catch (e) {
      console.error(e);
      alert("Failed to save rating");
    }
  };

  // Add root comment
  const addComment = async () => {
    const text = newComment.trim();
    if (!text) return;
    try {
      const res = await axios.post(`${BASE}/community/${post._id}/comments`, {
        text,
        authorName: "User",
      });
      setFull((p) => ({ ...(p || {}), comments: [ ...(p?.comments || []), res.data ] }));
      setNewComment("");
    } catch (e) {
      console.error(e);
      alert("Failed to post comment");
    }
  };

  // Upvote (persist + bubble up to feed)
  const upvote = async () => {
    setLikes((n) => n + 1); // optimistic
    try {
      const res = await axios.post(`${BASE}/community/${post._id}/upvote`);
      const serverLikes = typeof res?.data?.likes === "number" ? res.data.likes : undefined;
      if (serverLikes !== undefined) setLikes(serverLikes);
      onUpvoted?.(post._id, serverLikes);
    } catch (e) {
      console.error(e);
      setLikes((n) => Math.max(0, n - 1)); // rollback
      alert("Failed to upvote");
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      {/* Header — avatar, name, Follow */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-gray-900">{post.authorName || "Anonymous"}</h4>
              <button
                onClick={onFollow}
                className="rounded-full border border-gray-300 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
              >
                Follow
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{createdLine}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">⋯</button>
      </div>

      {/* Title */}
      <h2 className="mt-3 text-lg font-semibold text-gray-900">{post.title}</h2>

      {/* Description */}
      <p className="mt-2 text-gray-700 leading-relaxed">{post.comment}</p>

      {/* Image */}
      {post.image && (
        <div className="mt-3">
          <img
            src={post.image}
            alt="post"
            className="w-full max-h-[520px] rounded-xl border object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <StarRating value={postRating} onChange={ratePost} size="text-xl" />
          {postRating ? <span className="text-xs text-gray-500">{postRating}/5</span> : null}
        </div>

        <button onClick={upvote} className="flex items-center gap-1 hover:text-emerald-600">
          ⬆ Upvote · {likes}
        </button>

        <button onClick={() => setOpen((s) => !s)} className="flex items-center gap-1 hover:text-emerald-600">
          💬 {open ? "Hide comments" : `Comments (${post.comments?.length ?? full?.comments?.length ?? 0})`}
        </button>

        <button className="flex items-center gap-1 hover:text-emerald-600">↻ Share</button>
      </div>

      {/* Inline comments thread */}
      {open && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          {loading ? (
            <div className="text-sm text-gray-500">Loading comments…</div>
          ) : (
            <>
              {/* Composer */}
              <div>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Write your comment…"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 disabled:opacity-60"
                >
                  Post Comment
                </button>
              </div>

              {/* Comments list */}
              <div className="mt-4 space-y-3">
                {(full?.comments || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No comments yet.</p>
                ) : (
                  (full?.comments || []).map((c) => (
                    <CommentItem key={c._id} postId={post._id} comment={c} />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ----- One comment with nested replies composer/list -----
function CommentItem({ postId, comment }) {
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [local, setLocal] = useState(comment); // local copy to append replies

  const addReply = async () => {
    const text = replyText.trim();
    if (!text) return;
    setReplying(true);
    try {
      const res = await axios.post(
        `${BASE}/community/${postId}/comments/${local._id}/replies`,
        { text, authorName: "User" }
      );
      setLocal((c) => ({ ...c, replies: [ ...(c.replies || []), res.data ] }));
      setReplyText("");
    } catch (e) {
      console.error(e);
      alert("Failed to reply");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <div className="text-sm font-semibold text-gray-800">{local.authorName || "User"}</div>
      <p className="mt-1 text-gray-700 whitespace-pre-wrap">{local.text}</p>

      {/* Replies */}
      <div className="mt-3 space-y-2 pl-4 border-l">
        {(local.replies || []).map((r) => (
          <div key={r._id} className="rounded-lg bg-gray-50 p-2">
            <div className="text-xs font-semibold text-gray-700">{r.authorName || "User"}</div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.text}</p>
          </div>
        ))}

        {/* Reply composer */}
        <div className="mt-2">
          <textarea
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Write a reply…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button
            onClick={addReply}
            disabled={replying || !replyText.trim()}
            className="mt-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
          >
            {replying ? "Replying…" : "Reply"}
          </button>
        </div>
      </div>
    </div>
  );
}
