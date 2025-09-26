// src/pages/community/CommunityForum.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import CommunityPostCard from "./CommunityPostCard";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// likes desc, then date desc
const sortByPopularity = (arr) =>
  [...arr].sort((a, b) => {
    const lb = b.likes ?? 0, la = a.likes ?? 0;
    if (lb !== la) return lb - la;
    const db = new Date(b.createdAt || b.date || 0);
    const da = new Date(a.createdAt || a.date || 0);
    return db - da;
  });

export default function CommunityForum() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    try {
      const url = `${BASE}/community`;
      console.log("[GET]", url);
      const res = await axios.get(url);
      console.log("[OK] /community:", res.status, res.data);
      setPosts(sortByPopularity(res.data));
    } catch (e) {
      console.error("[ERR] /community", {
        message: e.message,
        status: e?.response?.status,
        data: e?.response?.data,
      });
      alert(`Failed to load posts: ${e?.response?.status || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // re-sort after a child card upvotes
  const handleUpvoted = (postId, likesFromServer) => {
    setPosts((prev) => {
      const updated = prev.map((p) =>
        p._id === postId ? { ...p, likes: likesFromServer ?? (p.likes ?? 0) + 1 } : p
      );
      return sortByPopularity(updated);
    });
  };

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8">Loading posts...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-emerald-700 mb-6">🌱 Community Forum</h1>
      {posts.length === 0 ? (
        <p className="text-gray-500">No posts yet.</p>
      ) : (
        posts.map((post) => (
          <CommunityPostCard key={post._id} post={post} onUpvoted={handleUpvoted} />
        ))
      )}
    </div>
  );
}
