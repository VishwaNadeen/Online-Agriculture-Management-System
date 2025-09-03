const mongoose = require("mongoose");
const Post = require("../models/post");

// If you have an auth middleware that sets req.user, you can gate actions by role.
const isAdminOrMod = (user) =>
  user && ["admin", "moderator"].includes(user.role);

function pick(obj, keys) {
  return keys.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});
}

function parseNumber(x, fallback) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function parseArray(q) {
  if (!q) return undefined;
  if (Array.isArray(q)) return q;
  return String(q)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildFilters(query) {
  const filters = {};
  const {
    q,
    author,
    crop,
    growthStage,
    diagnosisStatus,
    visibility,
    from,
    to,
  } = query;

  if (q) filters.$text = { $search: q };

  if (author) filters.author = new mongoose.Types.ObjectId(author);
  if (crop) filters.crop = crop;
  if (growthStage) filters.growthStage = growthStage;
  if (diagnosisStatus) filters.diagnosisStatus = diagnosisStatus;
  if (visibility) filters.visibility = visibility;

  const tags = parseArray(query.tags);
  if (tags?.length) filters.tags = { $all: tags };

  const suspectedPests = parseArray(query.pests);
  if (suspectedPests?.length)
    filters.suspectedPests = { $in: suspectedPests.map((s) => s.toLowerCase()) };

  const symptoms = parseArray(query.symptoms);
  if (symptoms?.length)
    filters.symptoms = { $in: symptoms.map((s) => s.toLowerCase()) };

  if (from || to) {
    filters.createdAt = {};
    if (from) filters.createdAt.$gte = new Date(from);
    if (to) filters.createdAt.$lte = new Date(to);
  }

  // Geospatial filter: near=lat,lng,km
  if (query.near) {
    const [latStr, lngStr, kmStr] = String(query.near).split(",");
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const km = parseFloat(kmStr || "25"); // default 25km
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      filters["location.geo"] = {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: Math.max(500, km * 1000), // meters
        },
      };
    }
  }

  // Exclude soft-deleted by default
  if (!query.includeDeleted) {
    filters.deletedAt = { $exists: false };
  }

  return filters;
}

/** Create a post */
exports.createPost = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.body.author; // fallback for tests
    if (!userId)
      return res.status(401).json({ message: "Unauthorized: no user" });

    const payload = pick(req.body, [
      "title",
      "description",
      "crop",
      "growthStage",
      "suspectedPests",
      "symptoms",
      "location",
      "occurredAt",
      "images",
      "attachments",
      "tags",
      "visibility",
      "diagnosisStatus",
    ]);

    const doc = await Post.create({
      ...payload,
      author: userId,
      roleAtPostTime: req.user?.role || "farmer",
      lastActivityAt: new Date(),
    });

    // Optional populate (adjust fields to match your User model)
    await doc.populate({ path: "author", select: "name role avatar" });

    return res.status(201).json({ data: doc });
  } catch (err) {
    next(err);
  }
};

/** Get a single post by id + bump view count */
exports.getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate({ path: "author", select: "name role avatar" })
      .populate({ path: "acceptedAnswer", select: "author content createdAt" })
      .lean();

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.deletedAt && !isAdminOrMod(req.user)) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Fire-and-forget: bump view counter
    await Post.bumpCounter(id, "views", 1);

    return res.json({ data: { ...post, counters: { ...post.counters, views: (post.counters?.views || 0) + 1 } } });
  } catch (err) {
    next(err);
  }
};

/** List posts with pagination, filtering, search, and sorting */
exports.listPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseNumber(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, parseNumber(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    const filters = buildFilters(req.query);

    // Sort presets: recent, top, active
    let sort = { createdAt: -1 };
    switch (req.query.sort) {
      case "top":
        sort = { "votes.up": -1, createdAt: -1 };
        break;
      case "active":
        sort = { lastActivityAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const [items, total] = await Promise.all([
      Post.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate({ path: "author", select: "name role avatar" })
        .lean(),
      Post.countDocuments(filters),
    ]);

    return res.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

/** Update a post (author or moderator/admin) */
exports.updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updates = pick(req.body, [
      "title",
      "description",
      "crop",
      "growthStage",
      "suspectedPests",
      "symptoms",
      "location",
      "occurredAt",
      "images",
      "attachments",
      "tags",
      "visibility",
      "diagnosisStatus",
      "acceptedAnswer",
    ]);

    const existing = await Post.findById(id);
    if (!existing) return res.status(404).json({ message: "Post not found" });

    const isOwner =
      req.user && String(existing.author) === String(req.user._id);

    if (!isOwner && !isAdminOrMod(req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    Object.assign(existing, updates, {
      isEdited: true,
      lastActivityAt: new Date(),
    });

    const saved = await existing.save();
    await saved.populate({ path: "author", select: "name role avatar" });

    return res.json({ data: saved });
  } catch (err) {
    next(err);
  }
};

/** Soft delete a post (author or moderator/admin) */
exports.softDeletePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doc = await Post.findById(id);
    if (!doc) return res.status(404).json({ message: "Post not found" });

    const isOwner =
      req.user && String(doc.author) === String(req.user._id);

    if (!isOwner && !isAdminOrMod(req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await doc.softDelete();

    return res.json({ message: "Post deleted (soft)", data: doc });
  } catch (err) {
    next(err);
  }
};

/** Vote on a post: body { dir: 1 | -1 } */
exports.votePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dir = Number(req.body?.dir) === -1 ? -1 : 1;

    const updated = await Post.vote(id, dir);
    if (!updated) return res.status(404).json({ message: "Post not found" });

    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
};

/** Accept an answer: body { commentId } (post owner or moderator/admin) */
exports.acceptAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { commentId } = req.body || {};

    if (!commentId)
      return res.status(400).json({ message: "commentId is required" });

    const doc = await Post.findById(id);
    if (!doc) return res.status(404).json({ message: "Post not found" });

    const isOwner =
      req.user && String(doc.author) === String(req.user._id);

    if (!isOwner && !isAdminOrMod(req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    doc.acceptedAnswer = new mongoose.Types.ObjectId(commentId);
    doc.diagnosisStatus = "answered";
    doc.lastActivityAt = new Date();
    await doc.save();

    return res.json({ data: doc });
  } catch (err) {
    next(err);
  }
};

/** Flag a post for moderation: body { reason } */
exports.flagPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reason = String(req.body?.reason || "").slice(0, 500);

    const doc = await Post.findByIdAndUpdate(
      id,
      {
        $set: {
          "moderation.flagged": true,
          "moderation.reason": reason || "Flagged by user",
          lastActivityAt: new Date(),
        },
      },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: "Post not found" });

    return res.json({ data: doc });
  } catch (err) {
    next(err);
  }
};

/** Clear moderation flag (moderator/admin only) */
exports.unflagPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isAdminOrMod(req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const doc = await Post.findByIdAndUpdate(
      id,
      {
        $set: {
          "moderation.flagged": false,
          "moderation.reason": null,
          "moderation.reviewedBy": req.user?._id || null,
          lastActivityAt: new Date(),
        },
      },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: "Post not found" });

    return res.json({ data: doc });
  } catch (err) {
    next(err);
  }
};
