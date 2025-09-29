import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import CommunityPost from "../models/CommunityPost.js";

const router = Router();

/* Identify user by header x-user-name; add name to req.userName */
function identifyUser(req, _res, next) {
  const raw = (req.headers["x-user-name"] || "").toString();
  req.userName = raw.trim() || "Anonymous";
  next();
}

/* Ensure uploads dir exists */
const uploadsDir = path.resolve(process.cwd(), "backend", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

/* Multer (optional image upload) */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

/* CREATE post */
router.post("/", identifyUser, upload.single("image"), async (req, res) => {
  try {
    const { title, comment, authorAvatar, category } = req.body;

    if (!title?.trim() || !comment?.trim()) {
      return res.status(400).json({ message: "Title and comment required" });
    }
    // NEW: block titles starting with a number
    if (/^\s*\d/.test(title.trim())) {
      return res.status(400).json({ message: "Title cannot start with a number." });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : (req.body.image || "");

    const post = await CommunityPost.create({
      title: title.trim(),
      comment: comment.trim(),
      authorName: req.userName,
      authorAvatar: authorAvatar || req.headers["x-user-avatar"] || "",
      image: imagePath,
      category: category || "General",
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ message: "Failed to create post" });
  }
});

/* LIST */
router.get("/", async (_req, res) => {
  const posts = await CommunityPost.find().sort({ createdAt: -1 }).lean();
  res.json(posts);
});

/* ONE */
router.get("/:id", async (req, res) => {
  const post = await CommunityPost.findById(req.params.id).lean();
  if (!post) return res.status(404).json({ message: "Not found" });
  res.json(post);
});

/* UPDATE (title/comment/image) */
router.put("/:id", identifyUser, async (req, res) => {
  try {
    const { title, comment, image } = req.body;

    if (title !== undefined && /^\s*\d/.test(String(title).trim())) {
      return res.status(400).json({ message: "Title cannot start with a number." });
    }

    const set = {};
    if (title !== undefined) set.title = String(title).trim();
    if (comment !== undefined) set.comment = String(comment).trim();
    if (image !== undefined) set.image = String(image);

    const post = await CommunityPost.findOneAndUpdate(
      { _id: req.params.id },
      { $set: set },
      { new: true, runValidators: true }
    );
    if (!post) return res.status(404).json({ message: "Not found" });
    res.json(post);
  } catch (err) {
    res.status(400).json({ message: err.message || "Update failed" });
  }
});

/* DELETE */
router.delete("/:id", identifyUser, async (req, res) => {
  try {
    const post = await CommunityPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ message: err.message || "Delete failed" });
  }
});

/* ---------- REACTIONS: toggle & swap per user (by name) ---------- */
async function applyReaction(req, res, type /* 'like' | 'dislike' */) {
  const user = (req.userName || "Anonymous").trim();
  const post = await CommunityPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Not found" });

  // find existing reaction from this user
  const idx = (post.reactions || []).findIndex((r) => (r.by || "").trim() === user);
  const prev = idx >= 0 ? post.reactions[idx].type : "none";

  // counts
  let likes = post.likes || 0;
  let dislikes = post.dislikes || 0;

  if (prev === type) {
    // toggle off
    if (type === "like") likes = Math.max(0, likes - 1);
    else dislikes = Math.max(0, dislikes - 1);
    if (idx >= 0) post.reactions.splice(idx, 1);
  } else {
    // switching or adding
    if (prev === "like") likes = Math.max(0, likes - 1);
    if (prev === "dislike") dislikes = Math.max(0, dislikes - 1);
    if (type === "like") likes += 1;
    if (type === "dislike") dislikes += 1;

    if (idx >= 0) post.reactions[idx].type = type;
    else post.reactions.push({ by: user, type });
  }

  post.likes = likes;
  post.dislikes = dislikes;
  await post.save();

  const myReaction = prev === type ? "none" : type;
  return res.json({ likes, dislikes, myReaction });
}

/* LIKE / DISLIKE endpoints now toggle/swap */
router.post("/:id/like", identifyUser, (req, res) => applyReaction(req, res, "like"));
router.post("/:id/dislike", identifyUser, (req, res) => applyReaction(req, res, "dislike"));

/* (Optional legacy toggles kept; forward to unified logic) */
router.post("/:id/like/toggle", identifyUser, (req, res) => applyReaction(req, res, "like"));
router.post("/:id/dislike/toggle", identifyUser, (req, res) => applyReaction(req, res, "dislike"));

/* COMMENTS */
router.post("/:id/comments", identifyUser, async (req, res) => {
  const { text } = req.body;
  const authorAvatar = req.body?.authorAvatar || req.headers["x-user-avatar"] || "";
  if (!text?.trim()) return res.status(400).json({ message: "Empty comment" });

  const post = await CommunityPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Not found" });

  const comment = {
    text: text.trim(),
    authorName: req.userName,
    authorAvatar,
  };

  post.comments.push(comment);
  await post.save();

  res.json(post.comments[post.comments.length - 1]);
});

/* --- Edit a comment (only by its author) --- */
router.put("/:id/comments/:commentId", identifyUser, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Empty comment" });

    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if ((comment.authorName || "Anonymous").trim() !== (req.userName || "Anonymous").trim()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    comment.text = text.trim();
    comment.updatedAt = new Date();
    await post.save();

    res.json({ _id: comment._id, text: comment.text, updatedAt: comment.updatedAt });
  } catch (err) {
    console.error("Edit comment error:", err);
    res.status(400).json({ message: err.message || "Failed to edit comment" });
  }
});

/* --- Delete a comment (only by its author) --- */
router.delete("/:id/comments/:commentId", identifyUser, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if ((comment.authorName || "Anonymous").trim() !== (req.userName || "Anonymous").trim()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    comment.deleteOne();
    await post.save();
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(400).json({ message: err.message || "Failed to delete comment" });
  }
});

/* REPLIES */
router.post("/:postId/comments/:commentId/replies", identifyUser, async (req, res) => {
  const { text } = req.body;
  const authorAvatar = req.body?.authorAvatar || req.headers["x-user-avatar"] || "";
  if (!text?.trim()) return res.status(400).json({ message: "Empty reply" });

  const post = await CommunityPost.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: "Not found" });

  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ message: "Comment not found" });

  const reply = {
    text: text.trim(),
    authorName: req.userName,
    authorAvatar,
  };

  comment.replies.push(reply);
  await post.save();

  res.json(comment.replies[comment.replies.length - 1]);
});

export default router;
