/**
 * backend/models/CommunityModel.js
 *
 * Community model for Green Grow (pest diagnosis + community forum).
 */

import mongoose from "mongoose";

const { Schema, Types } = mongoose;

/* ---------- Sub-schemas ---------- */
const ImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    caption: { type: String, trim: true, maxlength: 280 },
    width: Number,
    height: Number,
    sha256: { type: String, trim: true }, // optional for dedupe
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
    // GeoJSON coordinates: [lng, lat]
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

/* ---------- Main schema ---------- */
const CommunitySchema = new Schema(
  {
    author: { type: Types.ObjectId, ref: "User", required: true, index: true },
    roleAtPostTime: {
      type: String,
      enum: ["farmer", "expert", "moderator", "admin", "unknown"],
      default: "farmer",
    },

    // Core content
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 8000 },

    // Agronomy context
    crop: { type: String, trim: true, default: "Unknown" },
    growthStage: {
      type: String,
      enum: ["seedling", "vegetative", "flowering", "fruiting", "harvest", "unknown"],
      default: "unknown",
    },
    suspectedPests: [{ type: String, trim: true, lowercase: true, maxlength: 120 }],
    symptoms: [{ type: String, trim: true, lowercase: true, maxlength: 120 }],

    // Location & time
    location: {
      district: { type: String, trim: true, maxlength: 120 },
      country: { type: String, trim: true, maxlength: 120, default: "Sri Lanka" },
      geo: GeoPointSchema,
    },
    occurredAt: { type: Date },

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
    attachments: { type: [AttachmentSchema], default: [] },

    // Community & workflow
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],
    visibility: { type: String, enum: ["public", "unlisted", "private"], default: "public", index: true },
    diagnosisStatus: {
      type: String,
      enum: ["open", "needs-more-info", "answered", "resolved", "closed"],
      default: "open",
      index: true,
    },
    acceptedAnswer: { type: Types.ObjectId, ref: "Comment" },

    // Counters
    counters: {
      comments: { type: Number, default: 0, min: 0 },
      saves: { type: Number, default: 0, min: 0 },
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
    lastActivityAt: { type: Date, index: true },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ---------- Indexes ---------- */
CommunitySchema.index({
  title: "text",
  description: "text",
  symptoms: "text",
  suspectedPests: "text",
});
CommunitySchema.index({ "location.geo": "2dsphere" });
CommunitySchema.index({ diagnosisStatus: 1, lastActivityAt: -1 });
CommunitySchema.index({ visibility: 1, createdAt: -1 });

/* ---------- Hooks ---------- */
CommunitySchema.pre("save", function (next) {
  if (this.isNew) {
    this.lastActivityAt = this.lastActivityAt || new Date();
  } else if (this.isModified("description") || this.isModified("title")) {
    this.isEdited = true;
  }
  next();
});

/* ---------- Statics & Methods ---------- */
CommunitySchema.statics.bumpCounter = function (postId, key, delta = 1) {
  const allowed = ["views", "comments", "saves"];
  if (!allowed.includes(key)) throw new Error(`Invalid counter key: ${key}`);
  return this.findByIdAndUpdate(
    postId,
    { $inc: { [`counters.${key}`]: delta }, $set: { lastActivityAt: new Date() } },
    { new: true, lean: true }
  ).exec();
};

CommunitySchema.statics.vote = function (postId, dir = 1) {
  if (![1, -1].includes(dir)) throw new Error("dir must be +1 or -1");
  const field = dir === 1 ? "votes.up" : "votes.down";
  return this.findByIdAndUpdate(
    postId,
    { $inc: { [field]: 1 }, $set: { lastActivityAt: new Date() } },
    { new: true, lean: true }
  ).exec();
};

CommunitySchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  this.visibility = "private";
  this.diagnosisStatus = "closed";
  return this.save();
};

/* ---------- Virtuals ---------- */
CommunitySchema.virtual("score").get(function () {
  const up = this.votes?.up || 0;
  const down = this.votes?.down || 0;
  return up - down;
});

CommunitySchema.virtual("isDeleted").get(function () {
  return !!this.deletedAt;
});

/* ---------- Model ---------- */
const Community =
  mongoose.models.Community || mongoose.model("Community", CommunitySchema);

export default Community;
