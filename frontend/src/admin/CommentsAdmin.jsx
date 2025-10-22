// src/pages/Admin/CommentsAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BiTrash, BiX } from "react-icons/bi";
import { FiDownload } from "react-icons/fi";
import AdminLoader from "../components/AdminLoader";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative border border-white/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300/20"
        >
          <BiX className="text-xl text-gray-600" />
        </button>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
            </div>
            <p className="text-gray-600 font-medium">Loading post…</p>
          </div>
        ) : !post ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">Failed to load post.</p>
          </div>
        ) : (
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{post.title}</h2>
              {post.image && (
                <img
                  src={resolveImageUrl(post.image)}
                  alt="post"
                  className="w-full rounded-xl border border-gray-200 shadow-lg object-cover"
                />
              )}
              <div className="mt-4 text-gray-700 leading-relaxed">{post.description}</div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comments
              </h3>
              <div className="space-y-4">
                {(post.comments || []).map((c) => (
                  <div
                    key={c._id}
                    className="p-4 rounded-xl border border-emerald-200/50 bg-gradient-to-r from-emerald-50/60 to-emerald-100/40 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                        {(c.authorName || "A")[0].toUpperCase()}
                      </div>
                      <div className="font-semibold text-emerald-800">
                        {c.authorName || "Anonymous"}
                      </div>
                    </div>
                    <div className="text-gray-800 mb-2">{c.text}</div>
                    <div className="text-xs text-gray-500">
                      {fmtDateTime(c.createdAt)}
                    </div>
                  </div>
                ))}
                {(!post.comments || post.comments.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>No comments yet.</p>
                  </div>
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

  if (loading) {
    return <AdminLoader message="Loading comments..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-6 sm:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 bg-clip-text text-transparent mb-3">
                Community Comments
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                Manage and moderate all community comments and interactions.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={downloadCommentsReport}
                className="group relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                disabled={!pdfReady || comments.length === 0}
                title="Download Comments Report (PDF)"
              >
                <div className="flex items-center gap-2">
                  <FiDownload className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>Download Report</span>
                </div>
              </button>
              
              <button
                onClick={loadComments}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by comment, name, title, or category…"
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-emerald-200/50 bg-white/80 backdrop-blur-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/50 transition-all duration-300 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Comments Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="grid grid-cols-12 items-center bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-800 font-bold px-6 py-4 border-b border-emerald-200/50">
            <div className="col-span-3 text-sm tracking-wide">User</div>
            <div className="col-span-3 text-sm tracking-wide">Post Title</div>
            <div className="col-span-2 text-sm tracking-wide">Created</div>
            <div className="col-span-3 text-sm tracking-wide">Comment</div>
            <div className="col-span-1 text-center text-sm tracking-wide">Actions</div>
          </div>

          <div className="divide-y divide-emerald-100/50">
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No comments found</h3>
                <p className="text-gray-600">Try adjusting your search criteria.</p>
              </div>
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
                  <div key={c._id} className="group relative">
                    <div className="grid grid-cols-12 gap-4 items-start px-6 py-5 hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-transparent transition-all duration-300">
                      <div className="col-span-3 flex items-start gap-4">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt="avatar"
                            className="h-12 w-12 rounded-xl border-2 border-white shadow-lg object-cover"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {name?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <div className="leading-tight">
                          <div className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">{name}</div>
                          {c.postCategory && (
                            <div className="mt-2 inline-block text-xs px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300/50 font-medium">
                              {c.postCategory}
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className="col-span-3 text-gray-800 font-medium"
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

                      <div className="col-span-2 text-gray-600 text-sm whitespace-nowrap">
                        {fmtDateTime(c.createdAt)}
                      </div>

                      {/* Comment + post image thumbnail */}
                      <div className="col-span-3 text-gray-800">
                        <div className="flex items-start gap-3">
                          {c.postImage ? (
                            <button
                              onClick={() => setOpenPostId(c.postId)}
                              className="shrink-0 block group/img"
                              title="Open post (with comments)"
                            >
                              <img
                                src={c.postImage}
                                alt="post"
                                className="h-12 w-12 rounded-lg object-cover border-2 border-white shadow-lg group-hover/img:scale-105 transition-transform duration-200"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                              />
                            </button>
                          ) : null}

                          <button
                            onClick={() => toggleExpand(c._id)}
                            className="text-left w-full group/expand"
                            title={isOpen ? "Hide full comment" : "Show full comment"}
                          >
                            <span className="group-hover/expand:text-emerald-700 transition-colors">
                              {preview(c.text, 15)}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="col-span-1 flex items-center justify-center">
                        <button
                          onClick={() => deleteComment(c.postId, c._id)}
                          className={`group/btn relative p-2.5 rounded-lg transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 ${
                            isDeleting
                              ? "bg-red-100 opacity-50 cursor-not-allowed"
                              : "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 focus:ring-red-500/20"
                          }`}
                          title="Delete Comment"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <BiTrash className="text-lg group-hover/btn:scale-110 transition-transform duration-200" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="px-6 pb-5 -mt-2">
                        <div className="rounded-xl border border-emerald-200/50 bg-gradient-to-r from-emerald-50/60 to-emerald-100/40 p-4 text-gray-900 whitespace-pre-wrap shadow-sm">
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
    </div>
  );
}
