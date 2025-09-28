// backend/models/CommunityPost.js
import mongoose from "mongoose";

const ReplySchema = new mongoose.Schema({
  authorName: { type: String, trim: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const CommentSchema = new mongoose.Schema({
  authorName: { type: String, trim: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  replies: { type: [ReplySchema], default: [] },
});

const CommunityPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    comment: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    authorName: { type: String, default: "Anonymous" },
    category: { type: String, default: "General", trim: true },
    comments: { type: [CommentSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.CommunityPost ||
  mongoose.model("CommunityPost", CommunityPostSchema);
