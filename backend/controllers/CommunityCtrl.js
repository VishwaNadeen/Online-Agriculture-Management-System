// controllers/CommunityCtrl.js
import CommunityPost from "../models/CommunityPost.js";

const communityCtrl = {
  // ========= POSTS =========

  // Create a post
  async create(req, res) {
    try {
      const { title, comment, image, rating } = req.body;
      const post = await CommunityPost.create({
        title,
        comment,
        image,
        rating: typeof rating === "number" ? Math.max(1, Math.min(5, rating)) : undefined,
      });
      res.status(201).json(post);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // List posts (likes desc, then date desc)
  async list(req, res) {
    try {
      const posts = await CommunityPost.find().sort({ likes: -1, date: -1 });
      res.json(posts);
    } catch (err) {
      console.error("[Community:list] error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // Get a post (with comments & replies)
  async get(req, res) {
    try {
      const post = await CommunityPost.findById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(post);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Update a post (title/comment/image/rating)
  async update(req, res) {
    try {
      const { title, comment, image, rating } = req.body;
      const set = {};
      if (title !== undefined) set.title = title;
      if (comment !== undefined) set.comment = comment;
      if (image !== undefined) set.image = image;
      if (rating !== undefined) {
        set.rating = typeof rating === "number" ? Math.max(1, Math.min(5, rating)) : rating;
      }
      const post = await CommunityPost.findOneAndUpdate(
        { _id: req.params.id },
        { $set: set },
        { new: true, runValidators: true }
      );
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(post);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Delete a post
  async remove(req, res) {
    try {
      const post = await CommunityPost.findByIdAndDelete(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // ========= COMMENTS =========

  // Add root comment
  async addComment(req, res) {
    try {
      const { text, authorName } = req.body;
      if (!text) return res.status(400).json({ error: "Comment text required" });

      const post = await CommunityPost.findByIdAndUpdate(
        req.params.id,
        { $push: { comments: { text, authorName: authorName || "User" } } },
        { new: true }
      );
      if (!post) return res.status(404).json({ error: "Post not found" });

      const created = post.comments[post.comments.length - 1];
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // ========= REPLIES (nested under a specific comment) =========

  // Add reply to a comment
  async addReplyToComment(req, res) {
    try {
      const { text, authorName } = req.body;
      const { id, commentId } = req.params;
      if (!text) return res.status(400).json({ error: "Reply text required" });

      const post = await CommunityPost.findOneAndUpdate(
        { _id: id, "comments._id": commentId },
        { $push: { "comments.$.replies": { text, authorName: authorName || "User" } } },
        { new: true }
      );
      if (!post) return res.status(404).json({ error: "Post or comment not found" });

      const comment = post.comments.find((c) => c._id.toString() === commentId);
      const created = comment.replies[comment.replies.length - 1];
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // ========= UPVOTE =========

  async upvote(req, res) {
    try {
      const post = await CommunityPost.findOneAndUpdate(
        { _id: req.params.id },
        { $inc: { likes: 1 } },
        { new: true, projection: { likes: 1 } }
      );
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json({ likes: post.likes });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};

export default communityCtrl;
