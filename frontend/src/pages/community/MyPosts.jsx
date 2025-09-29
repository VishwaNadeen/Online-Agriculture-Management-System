// src/pages/community/MyPosts.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_BACKEND_URL || ""; // e.g. http://localhost:5000

export default function MyPosts() {
  const nav = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const PAGE_SIZE = 10;

  useEffect(() => {
    const token = localStorage.getItem("token"); // adjust based on your auth
    if (!token) {
      nav("/login"); // redirect if not logged in
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE}/api/community?author=me&page=${page}&limit=${PAGE_SIZE}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setPosts(data.posts || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error("Failed to load posts", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, nav]);

  if (loading) {
    return <div className="text-gray-500">Loading your posts…</div>;
  }

  if (!posts.length) {
    return (
      <div className="text-gray-600">
        You haven’t posted anything yet.{" "}
        <Link to="/community/new" className="text-emerald-700 underline">
          Create your first post
        </Link>
        .
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      {posts.map((p) => (
        <div key={p._id} className="rounded-xl border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                to={`/community/${p._id}`}
                className="text-lg font-semibold hover:underline"
              >
                {p.title}
              </Link>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {p.comment}
              </p>
              {p.image && (
                <img
                  src={p.image}
                  alt=""
                  className="mt-3 max-h-56 rounded-lg border object-cover"
                />
              )}
            </div>
            <div className="shrink-0 flex flex-col gap-2">
              <Link
                to={`/community/${p._id}/edit`}
                className="px-3 py-1 rounded border hover:bg-gray-50 text-sm"
              >
                Edit
              </Link>
              <Link
                to={`/community/${p._id}`}
                className="px-3 py-1 rounded bg-emerald-600 text-white text-sm text-center"
              >
                View
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <button
          className="px-3 py-1 rounded border disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          className="px-3 py-1 rounded border disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
