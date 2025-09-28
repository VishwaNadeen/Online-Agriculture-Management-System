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
    const { title, comment, authorAvatar } = req.body;
    if (!title?.trim() || !comment?.trim()) {
      return res.status(400).json({ message: "Title and comment required" });
    }
    const imagePath = req.file ? `/uploads/${req.file.filename}` : (req.body.image || "");

    const post = await CommunityPost.create({
      title: title.trim(),
      comment: comment.trim(),
      authorName: req.userName,
      authorAvatar: authorAvatar || "",
      image: imagePath,
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

/* UPDATE (title/comment/image) — used by your editor */
router.put("/:id", identifyUser, async (req, res) => {
  try {
    const { title, comment, image } = req.body;
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

/* DELETE — enables your Delete button */
router.delete("/:id", identifyUser, async (req, res) => {
  try {
    const post = await CommunityPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ message: err.message || "Delete failed" });
  }
});

/* LIKE / DISLIKE (simple increments) */
router.post("/:id/like", async (req, res) => {
  const updated = await CommunityPost.findByIdAndUpdate(
    req.params.id,
    { $inc: { likes: 1 } },
    { new: true, projection: { likes: 1, dislikes: 1 } }
  );
  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json({ likes: updated.likes ?? 0, dislikes: updated.dislikes ?? 0 });
});

router.post("/:id/dislike", async (req, res) => {
  const updated = await CommunityPost.findByIdAndUpdate(
    req.params.id,
    { $inc: { dislikes: 1 } },
    { new: true, projection: { likes: 1, dislikes: 1 } }
  );
  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json({ likes: updated.likes ?? 0, dislikes: updated.dislikes ?? 0 });
});

/* Support like/unlike toggle your UI already calls */
router.post("/:id/like/toggle", async (req, res) => {
  const { remove } = req.body || {};
  const post = await CommunityPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Not found" });
  post.likes = Math.max(0, (post.likes || 0) + (remove ? -1 : 1));
  await post.save();
  res.json({ likes: post.likes, dislikes: post.dislikes || 0 });
});

router.post("/:id/dislike/toggle", async (req, res) => {
  const { remove } = req.body || {};
  const post = await CommunityPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Not found" });
  post.dislikes = Math.max(0, (post.dislikes || 0) + (remove ? -1 : 1));
  await post.save();
  res.json({ likes: post.likes || 0, dislikes: post.dislikes });
});

/* COMMENTS */
router.post("/:id/comments", identifyUser, async (req, res) => {
  const { text, authorAvatar } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: "Empty comment" });

  const post = await CommunityPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Not found" });

  const comment = {
    text: text.trim(),
    authorName: req.userName,
    authorAvatar: authorAvatar || "",
  };

  post.comments.push(comment);
  await post.save();

  res.json(post.comments[post.comments.length - 1]);
});

/* REPLIES */
router.post("/:postId/comments/:commentId/replies", identifyUser, async (req, res) => {
  const { text, authorAvatar } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: "Empty reply" });

  const post = await CommunityPost.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: "Not found" });

  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ message: "Comment not found" });

  const reply = {
    text: text.trim(),
    authorName: req.userName,
    authorAvatar: authorAvatar || "",
  };

  comment.replies.push(reply);
  await post.save();

  res.json(comment.replies[comment.replies.length - 1]);
});

export default router;
