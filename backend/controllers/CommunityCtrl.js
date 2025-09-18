// controllers/communityCtrl.js
import CommunityPost from "../models/CommunityPost.js";

const communityCtrl = {
  // ========== POSTS ==========

  // CREATE a new post
  async create(req, res) {
    try {
      const { title, comment, image, rating } = req.body;
      const safeRating =
        typeof rating === "number" ? Math.max(1, Math.min(5, rating)) : undefined;

      const post = await CommunityPost.create({
        title,
        comment,
        image,
        rating: safeRating,
      });

      res.status(201).json(post);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // LIST all posts (newest first)
  async list(req, res) {
    try {
      const posts = await CommunityPost.find().sort({ date: -1 });
      res.json(posts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET one post by ID (with replies)
  async get(req, res) {
    try {
      const post = await CommunityPost.findById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(post);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // UPDATE a post
  async update(req, res) {
    try {
      const { title, comment, image, rating } = req.body;
      const updateDoc = {};
      if (title !== undefined) updateDoc.title = title;
      if (comment !== undefined) updateDoc.comment = comment;
      if (image !== undefined) updateDoc.image = image;
      if (rating !== undefined) {
        updateDoc.rating =
          typeof rating === "number" ? Math.max(1, Math.min(5, rating)) : rating;
      }

      const post = await CommunityPost.findOneAndUpdate(
        { _id: req.params.id },
        { $set: updateDoc },
        { new: true, runValidators: true }
      );

      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(post);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // DELETE a post
  async remove(req, res) {
    try {
      const post = await CommunityPost.findByIdAndDelete(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // ========== REPLIES ==========

  // LIST replies for a post
  async listReplies(req, res) {
    try {
      const post = await CommunityPost.findById(req.params.id, { replies: 1 });
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(post.replies || []);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // ADD a reply
  async addReply(req, res) {
    try {
      const { text, repliedBy } = req.body;
      if (!text || !repliedBy) {
        return res.status(400).json({ error: "Both 'text' and 'repliedBy' are required" });
      }

      const post = await CommunityPost.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { replies: { text, repliedBy } } },
        { new: true }
      );

      if (!post) return res.status(404).json({ error: "Post not found" });
      res.status(201).json(post);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // UPDATE a specific reply
  async updateReply(req, res) {
    try {
      const { replyId } = req.params;
      const { text, repliedBy } = req.body;

      const setDoc = {};
      if (text !== undefined) setDoc["replies.$.text"] = text;
      if (repliedBy !== undefined) setDoc["replies.$.repliedBy"] = repliedBy;
      setDoc["replies.$.date"] = new Date();

      const post = await CommunityPost.findOneAndUpdate(
        { _id: req.params.id, "replies._id": replyId },
        { $set: setDoc },
        { new: true }
      );

      if (!post) return res.status(404).json({ error: "Post or reply not found" });
      res.json(post);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // DELETE a specific reply
  async deleteReply(req, res) {
    try {
      const { replyId } = req.params;

      const post = await CommunityPost.findOneAndUpdate(
        { _id: req.params.id },
        { $pull: { replies: { _id: replyId } } },
        { new: true }
      );

      if (!post) return res.status(404).json({ error: "Post or reply not found" });
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};

export default communityCtrl;
