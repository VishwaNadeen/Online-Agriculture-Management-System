// models/CommunityPost.js
import mongoose from "mongoose";

// Reply subdocument schema
const ReplySchema = new mongoose.Schema(
  {
    repliedBy: { type: String, required: true, trim: true }, // Reply දාපු කෙනාගේ නම
    text:      { type: String, required: true, trim: true }, // Reply message එක
    date:      { type: Date, default: Date.now }             // Reply add කරන වෙලාව
  },
  { _id: true } // Reply එකකටත් unique _id එකක් auto-create වෙනවා
);

const CommunityPostSchema = new mongoose.Schema(
  {
    title:   { type: String, required: true, trim: true },
    comment: { type: String, required: true, trim: true },
    image:   { type: String, default: "" },
    rating:  { type: Number, min: 1, max: 5, default: 3 },
    date:    { type: Date, default: Date.now },  // main post date

    // Replies array
    replies: [ReplySchema]
  },
  { timestamps: true }
);

// Keep "date" auto-updated
CommunityPostSchema.pre("save", function (next) {
  this.date = new Date();
  next();
});
CommunityPostSchema.pre("findOneAndUpdate", function (next) {
  this.set({ date: new Date() });
  next();
});

const CommunityPost =
  mongoose.models.CommunityPost ||
  mongoose.model("CommunityPost", CommunityPostSchema);

export default CommunityPost;
