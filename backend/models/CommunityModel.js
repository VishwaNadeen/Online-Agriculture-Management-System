
const mongoose = require("mongoose");

const { Schema, Types } = mongoose;

// Small reusable sub-schemas
const ImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    caption: { type: String, trim: true, maxlength: 280 },
    width: Number,
    height: Number,
    // Optional: helps dedupe uploads if you compute it client/server side
    sha256: { type: String, trim: true },
  },
  { _id: false }
);

const AttachmentSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["image", "video", "pdf", "link", "other"],
      default: "image",
    },
    title: { type: String, trim: true, maxlength: 140 },
  },
  { _id: false }
);

const GeoPointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    // [longitude, latitude] per GeoJSON spec
    coordinates: {
      type: [Number],
      validate: {
        validator: (v) =>
          Array.isArray(v) &&
          v.length === 2 &&
          v[0] >= -180 &&
          v[0] <= 180 &&
          v[1] >= -90 &&
          v[1] <= 90,
        message: "coordinates must be [lng, lat]",
      },
    },
  },
  { _id: false }
);

const PostSchema = new Schema(
  {
    // Who created the post (required)
    author: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Snapshot of user's role at time of posting (for analytics/moderation)
    roleAtPostTime: {
      type: String,
      enum: ["farmer", "expert", "moderator", "admin", "unknown"],
      default: "farmer",
    },

    // Core content
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8000,
    },

    // Agronomy context
    crop: {
      type: String,
      trim: true,
      default: "Unknown",
      // You can later validate against a controlled list in app logic
    },
    growthStage: {
      type: String,
      enum: ["seedling", "vegetative", "flowering", "fruiting", "harvest", "unknown"],
      default: "unknown",
    },
    suspectedPests: [
      { type: String, trim: true, lowercase: true, maxlength: 120 },
    ],
    symptoms: [{ type: String, trim: true, lowercase: true, maxlength: 120 }],

    // Where and when the issue occurred
    location: {
      district: { type: String, trim: true, maxlength: 120 },
      country: { type: String, trim: true, maxlength: 120, default: "Sri Lanka" },
      geo: GeoPointSchema, // enables "near me" queries
    },
    occurredAt: { type: Date }, // When the farmer first noticed symptoms

    // Media
    images: {
      type: [ImageSchema],
      default: [],
      validate: [
        {
          validator: (arr) => arr.length <= 10,
          message: "Maximum of 10 images per post.",
        },
      ],
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },

    // Community + workflow
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],
    visibility: {
      type: String,
      enum: ["public", "unlisted", "private"],
      default: "public",
      index: true,
    },
    diagnosisStatus: {
      type: String,
      enum: ["open", "needs-more-info", "answered", "resolved", "closed"],
      default: "open",
      index: true,
    },
    acceptedAnswer: { type: Types.ObjectId, ref: "Comment" }, // comment chosen as the solution

    // Lightweight counters for quick UI (updated by service layer)
    counters: {
      comments: { type: Number, default: 0, min: 0 },
      saves: { type: Number, default: 0, min: 0 }, // bookmarks
      views: { type: Number, default: 0, min: 0 },
    },

    votes: {
      up: { type: Number, default: 0, min: 0 },
      down: { type: Number, default: 0, min: 0 },
    },

    // Moderation
    moderation: {
      flagged: { type: Boolean, default: false, index: true },
      reason: { type: String, trim: true, maxlength: 500 },
      reviewedBy: { type: Types.ObjectId, ref: "User" },
    },

    // System
    isEdited: { type: Boolean, default: false },
    lastActivityAt: { type: Date, index: true }, // for sorting feeds efficiently
    deletedAt: { type: Date }, // soft delete (keep for audits)
  },
  {
    timestamps: true, // adds createdAt, updatedAt
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Full-text search across common fields (supports $text queries)
PostSchema.index({
  title: "text",
  description: "text",
  symptoms: "text",
  suspectedPests: "text",
});

// Geospatial index for location-based search (nearby farms/diagnoses)
PostSchema.index({ "location.geo": "2dsphere" });

// Feed sorting: open posts updated recently, etc.
PostSchema.index({ diagnosisStatus: 1, lastActivityAt: -1 });
PostSchema.index({ visibility: 1, createdAt: -1 });

// Keep lastActivityAt fresh; mark edits
PostSchema.pre("save", function (next) {
  if (this.isNew) {
    this.lastActivityAt = this.lastActivityAt || new Date();
  } else {
    if (this.isModified("description") || this.isModified("title")) {
      this.isEdited = true;
    }
  }
  next();
});

//Increment a counter safely without reading the doc first.
//Usage (service layer): await Post.bumpCounter(postId, "views", 1)

PostSchema.statics.bumpCounter = function (postId, key, delta = 1) {
  const allowed = ["views", "comments", "saves"];
  if (!allowed.includes(key)) throw new Error(`Invalid counter key: ${key}`);
  return this.findByIdAndUpdate(
    postId,
    {
      $inc: { [`counters.${key}`]: delta },
      $set: { lastActivityAt: new Date() },
    },
    { new: true, lean: true }
  ).exec();
};

 // Register an upvote/downvote. Keeps values non-negative.

PostSchema.statics.vote = function (postId, dir = 1) {
  if (![1, -1].includes(dir)) throw new Error("dir must be +1 or -1");
  const field = dir === 1 ? "votes.up" : "votes.down";
  return this.findByIdAndUpdate(
    postId,
    { $inc: { [field]: 1 }, $set: { lastActivityAt: new Date() } },
    { new: true, lean: true }
  ).exec();
};

 //Soft delete a post (kept for audit/moderation).

PostSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  this.visibility = "private";
  this.diagnosisStatus = "closed";
  return this.save();
};

// Convenience: total score
PostSchema.virtual("score").get(function () {
  const up = this.votes?.up || 0;
  const down = this.votes?.down || 0;
  return up - down;
});

// Convenience: isDeleted flag
PostSchema.virtual("isDeleted").get(function () {
  return !!this.deletedAt;
});

const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);

module.exports = Post;
