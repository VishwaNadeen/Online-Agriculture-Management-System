// src/pages/Admin/CommentsAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BiTrash, BiX } from "react-icons/bi";
import { FiDownload } from "react-icons/fi";
import {
  ensurePdfStackReady,
  createGreenGrowLetterShell,
} from "../utils/pdf/greenGrowLetterShell";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const SITE_NAME = import.meta.env.VITE_SITE_NAME || "Green Grow";

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

/* ---------------- helpers for PDF ---------------- */

// best-effort likes extraction
function getLikesCount(c) {
  try {
    if (typeof c.likes === "number") return c.likes;
    if (Array.isArray(c.likes)) return c.likes.length;
    if (typeof c.likeCount === "number") return c.likeCount;
    if (Array.isArray(c.reactions)) return c.reactions.length;
    if (typeof c.reactionsCount === "number") return c.reactionsCount;
  } catch (_) {}
  return 0;
}

// try to load an image URL into a dataURL for jsPDF embedding
async function urlToDataURL(url, maxW = 220, maxH = 220) {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    // downscale via canvas so thumbs are small
    const bmp = await createImageBitmap(blob);
    const w = bmp.width;
    const h = bmp.height;
    const scale = Math.min(1, maxW / w, maxH / h);

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(w * scale));
    canvas.height = Math.max(1, Math.floor(h * scale));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    bmp.close();
    return dataUrl;
  } catch (_) {
    return null; // gracefully fail
  }
}

/* ---------------- Popup Modal ---------------- */
function PostModal({ postId, onClose }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BASE_URL}/community/${postId}`);
        setPost(res.data);
      } catch (err) {
        console.error("Failed to load post", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  if (!postId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-gray-200 hover:bg-gray-300"
        >
          <BiX className="text-xl" />
        </button>

        {loading ? (
          <div className="p-6 text-gray-600">Loading post…</div>
        ) : !post ? (
          <div className="p-6 text-red-600">Failed to load post.</div>
        ) : (
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold">{post.title}</h2>
            {post.image && (
              <img
                src={resolveImageUrl(post.image)}
                alt="post"
                className="w-full rounded-lg border object-cover"
              />
            )}
            <div className="text-gray-700">{post.description}</div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Comments</h3>
              <div className="space-y-3">
                {(post.comments || []).map((c) => (
                  <div
                    key={c._id}
                    className="p-3 rounded-lg border bg-gray-50"
                  >
                    <div className="font-medium text-emerald-800">
                      {c.authorName || "Anonymous"}
                    </div>
                    <div className="text-gray-800">{c.text}</div>
                    <div className="text-xs text-gray-500">
                      {fmtDateTime(c.createdAt)}
                    </div>
                  </div>
                ))}
                {(!post.comments || post.comments.length === 0) && (
                  <div className="text-gray-500">No comments yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Main Admin Page ---------------- */
export default function CommentsAdmin() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfReady, setPdfReady] = useState(false);
  const [deleting, setDeleting] = useState(new Set());
  const [expanded, setExpanded] = useState(() => new Set());
  const [q, setQ] = useState("");
  const [openPostId, setOpenPostId] = useState(null);

  const loadComments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/community`);
      const all = [];
      (res.data || []).forEach((post) => {
        const postImageRaw =
          post.image ||
          post.thumbnail ||
          (Array.isArray(post.images) && post.images[0]) ||
          post.photoURL ||
          post.picture ||
          (post.media &&
            (post.media.url ||
              (Array.isArray(post.media) && post.media[0]?.url))) ||
          "";
        const postImage = resolveImageUrl(postImageRaw);

        (post.comments || []).forEach((c) => {
          // find a comment-level uploaded image if any
          const cImgRaw =
            c.image ||
            c.photo ||
            c.picture ||
            (Array.isArray(c.images) && c.images[0]) ||
            "";
          const commentImage = resolveImageUrl(cImgRaw);

          all.push({
            ...c,
            postId: post._id,
            postTitle: post.title,
            postCategory: post.category,
            postImage,
            commentImage, // keep for PDF
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
    (async () => {
      try {
        await ensurePdfStackReady();
        setPdfReady(true);
      } catch (e) {
        console.error("Failed to preload PDF deps:", e);
      }
    })();
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
      const comment = comments.find((c) => c._id === commentId);
      if (!comment) throw new Error("Comment not found in state");

      const response = await axios.delete(
        `${BASE_URL}/community/${postId}/comments/${commentId}`,
        {
          headers: {
            "x-user-name": comment.authorName || "Anonymous",
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
      alert("Failed to delete comment. Please try again.");
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

  /* ---------- PDF generation ---------- */
  const downloadCommentsReport = async () => {
    try {
      if (loading) { alert("Please wait until data loads."); return; }
      if (!filtered.length) { alert("No comments to export."); return; }
      if (!pdfReady) { await ensurePdfStackReady(); setPdfReady(true); }

      const nowStr = new Date().toLocaleString(undefined, {
        year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
      });

      // Build aggregates by commenter
      const byUser = new Map();
      filtered.forEach((c) => {
        const name = c.authorName || "Anonymous";
        const likes = getLikesCount(c);
        const entry = byUser.get(name) || { name, count: 0, lastAt: null };
        entry.count += 1;
        const created = new Date(c.createdAt || 0);
        if (!entry.lastAt || created > entry.lastAt) entry.lastAt = created;
        byUser.set(name, entry);
      });
      const commenters = Array.from(byUser.values()).sort((a, b) => b.count - a.count);

      // Prepare image thumbnails for comments (best effort)
      const photoMap = {};
      const MAX_IMG = 25; // don't fetch too many to keep it fast
      let fetched = 0;
      for (const c of filtered) {
        if (fetched >= MAX_IMG) break;
        const url = c.commentImage || c.postImage; // prefer comment image, fallback post image
        const dataUrl = await urlToDataURL(url, 140, 140);
        if (dataUrl) {
          photoMap[c._id] = dataUrl;
          fetched += 1;
        }
      }

      // Create PDF shell
      const { doc, margins, contentWidth, addPage, save } =
        await createGreenGrowLetterShell({
          brandName: SITE_NAME,
          brandAccent: [4, 120, 87],
          brandPrimary: [17, 24, 39],
          addressLines: ["123 Harvest Lane, Agricultural District, Colombo 05, Sri Lanka"],
          contactLine: "Contact: +94 11 234 5678",
          emailLine: "Email: support@greengrow.lk",
          rightTitle: "Comments Report",
          rightSubTitle: `Generated on ${nowStr}`,
          footerNoteLeft: "This is a computer-generated report.",
          footerNoteRight: "greengrow.lk | +94 11 234 5678",
        });

      let y = Math.max(margins.top, 36);
      const x = margins.left;
      const pageH = doc.internal.pageSize.getHeight();

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text(`${SITE_NAME} — Community Comments Summary`, x, y); y += 6;

      // Divider
      doc.setDrawColor(4, 120, 87);
      doc.setLineWidth(0.6);
      doc.line(x, y, x + contentWidth, y); y += 7;

      // Summary
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Total Comments: ${filtered.length}`, x, y); y += 5;
      doc.text(`Unique Commenters: ${commenters.length}`, x, y); y += 9;

      // Commenters table
      if (y > (pageH - margins.bottom - 36)) { addPage(); y = Math.max(margins.top, 36); }
      doc.setFont("helvetica", "bold");
      doc.text("Commenters", x, y); y += 5;
      doc.autoTable({
        startY: y,
        head: [["#", "User", "Comments", "Last Comment"]],
        body: commenters.map((u, i) => [
          String(i + 1),
          u.name,
          String(u.count),
          u.lastAt ? fmtDateTime(u.lastAt) : "-",
        ]),
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [236, 253, 245], textColor: [4, 120, 87] },
        columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 60 }, 2: { cellWidth: 22 }, 3: { cellWidth: 44 } },
        theme: "striped",
        margin: { left: margins.left, right: margins.right },
      });
      y = doc.lastAutoTable.finalY + 8;

      // Comments table (with Likes and Photo)
      if (y > (pageH - margins.bottom - 36)) { addPage(); y = Math.max(margins.top, 36); }
      doc.setFont("helvetica", "bold");
      doc.text("Comments", x, y); y += 5;

      const rows = filtered.map((c, i) => ({
        idx: String(i + 1),
        user: c.authorName || "Anonymous",
        title: c.postTitle || "-",
        created: fmtDateTime(c.createdAt),
        likes: String(getLikesCount(c)),
        preview: preview(c.text, 90),
        _id: c._id,
      }));

      doc.autoTable({
        startY: y,
        head: [["#", "User", "Post Title", "Created", "Likes", "Photo", "Comment"]],
        body: rows.map((r) => [r.idx, r.user, r.title, r.created, r.likes, "", r.preview]),
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak", valign: "middle" },
        headStyles: { fillColor: [236, 253, 245], textColor: [4, 120, 87] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 34 },
          2: { cellWidth: 44 },
          3: { cellWidth: 30 },
          4: { cellWidth: 14, halign: "center" },
          5: { cellWidth: 18 }, // Photo
          6: { cellWidth: contentWidth - (8 + 34 + 44 + 30 + 14 + 18) }, // remaining
        },
        theme: "striped",
        margin: { left: margins.left, right: margins.right },
        didDrawCell: (data) => {
          // Inject image in "Photo" column
          const col = data.column.index;
          const row = data.row.index;
          if (data.section === "body" && col === 5) {
            const commentId = filtered[row]?._id;
            const img = photoMap[commentId];
            if (img) {
              const { x: cx, y: cy, height, width } = data.cell;
              const pad = 1.5;
              const imgW = width - pad * 2;
              const imgH = height - pad * 2;
              try {
                doc.addImage(img, "JPEG", cx + pad, cy + pad, imgW, imgH, undefined, "FAST");
              } catch (_) {
                // if addImage fails, leave blank
              }
            } else {
              // draw en dash if no image
              doc.setTextColor(107, 114, 128);
              doc.setFont("helvetica", "normal");
              doc.setFontSize(8);
              doc.text("—", data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2, { align: "center" });
            }
          }
        },
      });

      save(`${SITE_NAME.replace(/\s+/g, "_")}_Comments_Report.pdf`);
    } catch (err) {
      console.error(err);
      alert("Comments PDF download failed.");
    }
  };

  if (loading) return <div className="text-gray-600 p-6">Loading comments...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">All Comments</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadCommentsReport}
            className="px-3 py-2 rounded-lg border shadow-sm inline-flex items-center gap-2 bg-emerald-700 text-white border-emerald-600/50 hover:shadow-emerald-700/30 disabled:opacity-50"
            disabled={!pdfReady || comments.length === 0}
            title="Download Comments Report (PDF)"
          >
            <FiDownload />
            Download report
          </button>
          <button
            onClick={loadComments}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:brightness-105"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by comment, name, title, or category…"
          className="w-full rounded-xl border-2 border-emerald-200 p-3 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 bg-white"
        />
      </div>

      <div className="rounded-2xl overflow-hidden border border-emerald-200 bg-white shadow">
        <div className="grid grid-cols-12 items-center bg-emerald-100/80 text-emerald-900 font-semibold px-4 py-3">
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Post Title</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-3">Comment</div>
          <div className="col-span-1 text-center">Action</div>
        </div>

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
                  <div className="grid grid-cols-12 gap-3 items-start px-4 py-4 hover:bg-emerald-50/40 transition-colors">
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

                    <div className="col-span-2 text-gray-700 whitespace-nowrap">
                      {fmtDateTime(c.createdAt)}
                    </div>

                    {/* Comment + post image thumbnail */}
                    <div className="col-span-3 text-gray-800">
                      <div className="flex items-start gap-3">
                        {c.postImage ? (
                          <button
                            onClick={() => setOpenPostId(c.postId)}
                            className="shrink-0 block"
                            title="Open post (with comments)"
                          >
                            <img
                              src={c.postImage}
                              alt="post"
                              className="h-12 w-12 rounded-md object-cover border border-emerald-200 hover:opacity-90"
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          </button>
                        ) : null}

                        <button
                          onClick={() => toggleExpand(c._id)}
                          className="text-left w-full"
                          title={isOpen ? "Hide full comment" : "Show full comment"}
                        >
                          {preview(c.text, 15)}
                        </button>
                      </div>
                    </div>

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

      {/* Popup Modal */}
      {openPostId && <PostModal postId={openPostId} onClose={() => setOpenPostId(null)} />}
    </div>
  );
}
