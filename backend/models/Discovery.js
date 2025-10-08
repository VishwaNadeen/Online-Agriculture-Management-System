import mongoose from "mongoose";

const DiscoverySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true, maxlength: 8000 },
    category: { type: String, trim: true, default: "General" },
    tags: [{ type: String, trim: true }],
    thumbnail: {
      url: String,
      publicId: String,
      width: Number,
      height: Number,
      format: String,
    },
    readMoreUrl: { type: String, trim: true },
    isPublished: { type: Boolean, default: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

DiscoverySchema.pre("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 220);
  }
  next();
});

export default mongoose.model("Discovery", DiscoverySchema);
