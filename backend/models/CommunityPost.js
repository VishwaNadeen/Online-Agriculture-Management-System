// models/CommunityPost.js
import mongoose from "mongoose";

// A reply under a comment
const ReplySchema = new mongoose.Schema(
  {
    authorName: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// A root comment with nested replies
const CommentSchema = new mongoose.Schema(
  {
    authorName: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    replies: { type: [ReplySchema], default: [] },
  },
  { _id: true }
);

const CommunityPostSchema = new mongoose.Schema(
  {
    title:   { type: String, required: true, trim: true },
    comment: { type: String, required: true, trim: true }, // description
    image:   { type: String, default: "" },
    rating:  { type: Number, min: 1, max: 5, default: 3 }, // post rating
    likes:   { type: Number, default: 0 },                 // upvotes
    comments:{ type: [CommentSchema], default: [] },       // root comments
    date:    { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// keep "date" current on changes
CommunityPostSchema.pre("save", function (next) {
  this.date = new Date();
  next();
});
CommunityPostSchema.pre("findOneAndUpdate", function (next) {
  this.set({ date: new Date() });
  next();
});

export default mongoose.models.CommunityPost ||
  mongoose.model("CommunityPost", CommunityPostSchema);
