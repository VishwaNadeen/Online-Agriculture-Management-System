import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ConfirmDialog from "./ConfirmDialog";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const cls = (...xs) => xs.filter(Boolean).join(" ");
const time = (d) => (d ? new Date(d).toLocaleDateString() : "-");

export default function DiscoveryAll() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, limit: 12 });

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [published, setPublished] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [delRow, setDelRow] = useState(null); // item selected to delete

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [items]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setErr("");
    try {
      const params = {
        q: q || undefined,
        category: category || undefined,
        published: published === "" ? undefined : published === "true",
        sort,
        page,
        limit: 12,
      };
      const res = await axios.get(`${BASE}/api/discoveries`, { params });
      setItems(res.data?.data || []);
      setMeta(res.data?.meta || { total: 0, page: 1, pages: 1, limit: 12 });
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load discoveries");
    } finally {
      setLoading(false);
    }
  }, [q, category, published, sort]);

  useEffect(() => { load(1); }, [load]);

  const deleteItem = async () => {
    if (!delRow) return;
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in as admin.");
      return;
    }
    try {
      await axios.delete(`${BASE}/api/discoveries/${delRow._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Deleted.");
      setDelRow(null);
      load(meta.page);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-green-50/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-emerald-900">Discoveries (Admin)</h1>
            <p className="text-sm text-emerald-800/80">Manage all discoveries: search, filter, edit, or delete.</p>
          </div>
          <div>
            <button
              onClick={() => navigate("/admin/discoveries/new")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
            >
              + New Discovery
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, description, tags…"
              className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-sm focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value === "All" ? "" : e.target.value)}
              className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-sm focus:border-emerald-400"
            >
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={published}
              onChange={(e) => setPublished(e.target.value)}
              className="rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-sm focus:border-emerald-400"
            >
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-sm focus:border-emerald-400"
            >
              <option value="-createdAt">Newest</option>
              <option value="createdAt">Oldest</option>
              <option value="title">Title A–Z</option>
              <option value="-title">Title Z–A</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => load(1)}
            className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-emerald-200 bg-white hover:bg-emerald-50"
          >
            Apply
          </button>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-100 bg-white ring-1 ring-black/5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-emerald-50/70">
                <tr className="text-emerald-900">
                  <th className="px-4 py-3 text-left font-semibold">Item</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Published</th>
                  <th className="px-4 py-3 text-left font-semibold">Created</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading && (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`s-${i}`} className="animate-pulse">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-16 rounded bg-emerald-100" />
                          <div>
                            <div className="h-4 w-40 rounded bg-emerald-100" />
                            <div className="mt-1 h-3 w-56 rounded bg-emerald-100" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><div className="h-4 w-20 bg-emerald-100 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-16 bg-emerald-100 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-24 bg-emerald-100 rounded" /></td>
                      <td className="px-4 py-3 text-right"><div className="h-8 w-28 bg-emerald-100 rounded ml-auto" /></td>
                    </tr>
                  ))
                )}

                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-emerald-900">
                      No results.
                    </td>
                  </tr>
                )}

                {!loading && items.map((d) => (
                  <tr key={d._id} className="hover:bg-emerald-50/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 overflow-hidden rounded ring-1 ring-emerald-100 bg-emerald-50">
                          {d.thumbnail?.url ? (
                            <img src={d.thumbnail.url} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-emerald-950 truncate max-w-[340px]">{d.title}</div>
                          <div className="text-xs text-emerald-800/70 truncate max-w-[420px]">{d.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 ring-1 ring-emerald-200">
                        {d.category || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.isPublished ? (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-200">Published</span>
                      ) : (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-700 ring-1 ring-amber-200">Draft</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{time(d.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/discoveries/${d.slug || d._id}/edit`}
                          className="rounded-lg px-3 py-1.5 text-xs ring-1 ring-emerald-200 text-emerald-900 hover:bg-emerald-50"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDelRow(d)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-emerald-100 bg-emerald-50/30 text-sm">
            <div className="text-emerald-900">
              {meta.total} total • page {meta.page} / {meta.pages || 1}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={meta.page <= 1 || loading}
                onClick={() => load(meta.page - 1)}
                className={cls("rounded-lg px-3 py-1.5 ring-1 ring-emerald-200 hover:bg-emerald-50", (meta.page <= 1 || loading) && "opacity-50 cursor-not-allowed")}
              >
                Prev
              </button>
              <button
                disabled={meta.page >= meta.pages || loading}
                onClick={() => load(meta.page + 1)}
                className={cls("rounded-lg px-3 py-1.5 ring-1 ring-emerald-200 hover:bg-emerald-50", (meta.page >= meta.pages || loading) && "opacity-50 cursor-not-allowed")}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!delRow}
        title="Delete discovery?"
        message="This will permanently remove the discovery and its Cloudinary thumbnail. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setDelRow(null)}
        onConfirm={deleteItem}
      />
    </div>
  );
}
