import { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import DiscoveryDetailsCard from "../../components/discoveries/DiscoveryDetailsCard";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/* Small helpers */
const cls = (...xs) => xs.filter(Boolean).join(" ");
const timeAgo = (date) => {
  const d = new Date(date);
  const diff = Math.max(0, Date.now() - d.getTime());
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

function useDebounced(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function DiscoveryPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, limit: 12 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("-createdAt"); // newest first
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [fetchingOne, setFetchingOne] = useState(false);

  const dq = useDebounced(q, 450);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [items]);

  const fetchList = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      setErr("");
      try {
        const params = {
          q: dq || undefined,
          category: category || undefined,
          tag: tag || undefined,
          sort,
          page: pageNum,
          limit: 12,
          published: true,
        };
        const res = await axios.get(`${BASE}/api/discoveries`, { params });
        if (pageNum === 1) {
          setItems(res.data?.data || []);
        } else {
          setItems((prev) => [...prev, ...(res.data?.data || [])]);
        }
        setMeta(res.data?.meta || { total: 0, page: 1, pages: 1, limit: 12 });
        setPage(pageNum);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load discoveries");
      } finally {
        setLoading(false);
      }
    },
    [dq, category, tag, sort]
  );

  const fetchOne = useCallback(async (idOrSlug) => {
    setFetchingOne(true);
    try {
      const res = await axios.get(`${BASE}/api/discoveries/${idOrSlug}`);
      setSelected(res.data?.data || null);
      setOpen(true);
    } catch (e) {
      // if fetch fails, still open with list item
      setOpen(true);
    } finally {
      setFetchingOne(false);
    }
  }, []);

  useEffect(() => {
    // on filter/search change → reset to page 1
    fetchList(1);
  }, [fetchList]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-emerald-900">
              Discoveries & Agri News
            </h1>
            <p className="text-sm text-emerald-700/80 mt-1">
              Latest technologies, research updates, and innovations curated by admins.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search innovations, tags, keywords…"
                className="w-full sm:w-80 rounded-xl border border-emerald-200 bg-white/80 px-4 py-2.5 pr-9 shadow-sm ring-1 ring-black/5 placeholder:text-emerald-900/40 focus:border-emerald-400 focus:outline-none"
              />
              <svg className="pointer-events-none absolute right-3 top-2.5 h-5 w-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" d="m21 21-4.3-4.3M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
              </svg>
            </div>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value === "All" ? "" : e.target.value)}
              className="rounded-xl border border-emerald-200 bg-white/80 px-3 py-2.5 shadow-sm ring-1 ring-black/5 focus:border-emerald-400"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-emerald-200 bg-white/80 px-3 py-2.5 shadow-sm ring-1 ring-black/5 focus:border-emerald-400"
            >
              <option value="-createdAt">Newest</option>
              <option value="createdAt">Oldest</option>
              <option value="title">Title A–Z</option>
              <option value="-title">Title Z–A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tags (optional quick filter) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-5">
        <div className="flex flex-wrap gap-2">
          {["Technology","Crops","Soil","Climate","Organic","Pests"].map((t) => {
            const active = tag === t;
            return (
              <button
                key={t}
                onClick={() => setTag(active ? "" : t)}
                className={cls(
                  "px-3 py-1.5 rounded-full text-sm border transition",
                  active
                    ? "bg-emerald-600 text-white border-emerald-600 shadow"
                    : "bg-white border-emerald-200 text-emerald-800 hover:border-emerald-400"
                )}
              >
                #{t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 pb-16">
        {err ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {err}
          </div>
        ) : null}

        {/* Skeleton */}
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm ring-1 ring-black/5">
                <div className="h-40 bg-emerald-100/60" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-2/3 bg-emerald-100 rounded" />
                  <div className="h-3 w-full bg-emerald-100 rounded" />
                  <div className="h-3 w-5/6 bg-emerald-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Results */}
        {items.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((d) => (
                <article
                  key={d._id}
                  className="group overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
                >
                  <div className="relative h-44 w-full overflow-hidden">
                    {d.thumbnail?.url ? (
                      <img
                        src={d.thumbnail.url}
                        alt={d.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-400">
                        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" d="M3 5h18M3 19h18M3 5v14m18-14v14M7 15l3-3 3 3 4-4 3 3" />
                        </svg>
                      </div>
                    )}

                    {/* Category badge */}
                    {d.category && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow ring-1 ring-black/5">
                        {d.category}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="line-clamp-2 text-base font-semibold text-emerald-950">
                      {d.title}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm text-emerald-800/80">
                      {d.description}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-emerald-700/70">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5">
                          {d.author?.firstName ? `${d.author.firstName} ${d.author.lastName || ""}`.trim() : "Admin"}
                        </span>
                        <span>•</span>
                        <span>{timeAgo(d.createdAt)}</span>
                      </div>

                      <button
                        onClick={() => {
                          // Prefer slug if available
                          const idOrSlug = d.slug || d._id;
                          setSelected(d);
                          fetchOne(idOrSlug);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-emerald-700 focus:outline-none"
                      >
                        View
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Tags */}
                    {Array.isArray(d.tags) && d.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {d.tags.slice(0, 4).map((t) => (
                          <span key={t} className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[11px] text-emerald-800">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* Load more */}
            {meta.page < meta.pages && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => fetchList(page + 1)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm ring-1 ring-emerald-200 hover:bg-emerald-50 disabled:opacity-60"
                >
                  {loading ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}

        {!loading && items.length === 0 && !err && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
            No discoveries yet. Try a different search or come back later.
          </div>
        )}
      </div>

      {/* Details modal */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 top-10 mx-auto w-[min(100%,900px)] px-4 sm:px-6">
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/10">
              <div className="flex items-center justify-between border-b border-emerald-100/60 bg-gradient-to-r from-emerald-50 to-white px-4 py-3">
                <h2 className="text-sm font-medium text-emerald-900">Discovery Details</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-emerald-800 hover:bg-emerald-100"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 sm:p-6">
                <DiscoveryDetailsCard discovery={selected} fetching={fetchingOne} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
