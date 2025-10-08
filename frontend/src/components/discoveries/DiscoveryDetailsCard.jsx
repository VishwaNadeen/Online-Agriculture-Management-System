/* eslint-disable react/prop-types */
const fallbackImg =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'>
      <rect width='100%' height='100%' fill='#ecfdf5'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#059669' font-family='Arial' font-size='16'>
        Discovery
      </text>
    </svg>`
  );

const wordsPerMin = 180;
const readingTime = (text = "") => {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  if (!words) return "—";
  const mins = Math.max(1, Math.round(words / wordsPerMin));
  return `${mins} min read`;
};

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "";
  }
};

export default function DiscoveryDetailsCard({ discovery, fetching = false }) {
  if (fetching && !discovery) {
    return (
      <div className="animate-pulse">
        <div className="h-56 w-full rounded-xl bg-emerald-100" />
        <div className="mt-4 h-6 w-2/3 rounded bg-emerald-100" />
        <div className="mt-2 h-4 w-1/2 rounded bg-emerald-100" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-emerald-100" />
          <div className="h-3 w-5/6 rounded bg-emerald-100" />
          <div className="h-3 w-2/3 rounded bg-emerald-100" />
        </div>
      </div>
    );
  }

  if (!discovery) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
        Unable to load this discovery.
      </div>
    );
  }

  const img = discovery.thumbnail?.url || fallbackImg;
  const author =
    discovery.author?.firstName
      ? `${discovery.author.firstName} ${discovery.author.lastName || ""}`.trim()
      : "Admin";
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/discoveries/${discovery.slug || discovery._id}`
      : "";

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      {/* Image */}
      <div className="lg:col-span-2">
        <div className="overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50">
          <img src={img} alt={discovery.title} className="h-64 w-full object-cover" />
        </div>

        {/* Quick meta */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-emerald-800/80">
          {discovery.category && (
            <span className="rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700 ring-1 ring-emerald-200">
              {discovery.category}
            </span>
          )}
          {Array.isArray(discovery.tags) &&
            discovery.tags.slice(0, 5).map((t) => (
              <span
                key={t}
                className="rounded-full bg-white px-2 py-1 ring-1 ring-emerald-200"
              >
                #{t}
              </span>
            ))}
        </div>
      </div>

      {/* Content */}
      <div className="lg:col-span-3">
        <h3 className="text-xl font-semibold text-emerald-950">{discovery.title}</h3>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-emerald-800/80">
          <span className="rounded-md bg-white px-2 py-1 ring-1 ring-emerald-200">
            By {author}
          </span>
          {discovery.createdAt && (
            <>
              <span>•</span>
              <span>{formatDate(discovery.createdAt)}</span>
            </>
          )}
          <span>•</span>
          <span>{readingTime(discovery.description)}</span>
          {discovery.isPublished === false && (
            <>
              <span>•</span>
              <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-800 ring-1 ring-amber-200">
                Unpublished
              </span>
            </>
          )}
        </div>

        <div className="prose prose-sm mt-4 max-w-none text-emerald-900 prose-headings:text-emerald-950 prose-a:text-emerald-700">
          <p className="whitespace-pre-wrap leading-relaxed">{discovery.description}</p>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {discovery.readMoreUrl && (
            <a
              href={discovery.readMoreUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 focus:outline-none"
            >
              Read full article
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" d="M7 17 17 7M7 7h10v10" />
              </svg>
            </a>
          )}

          <button
            onClick={async () => {
              try {
                if (navigator.share && shareUrl) {
                  await navigator.share({ title: discovery.title, url: shareUrl });
                } else if (shareUrl) {
                  await navigator.clipboard.writeText(shareUrl);
                  alert("Link copied to clipboard!");
                }
              } catch {}
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-emerald-900 shadow-sm ring-1 ring-emerald-200 hover:bg-emerald-50"
          >
            Share
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
