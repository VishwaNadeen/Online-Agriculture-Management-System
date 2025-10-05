import { validationResult, matchedData } from "express-validator";
import stream from "stream";
import Discovery from "../models/Discovery.js";
import cloudinary from "../config/cloudinary.js"; // uses your existing config

const uploadBufferToCloudinary = (buffer, folder = "greengrow/discoveries") =>
  new Promise((resolve, reject) => {
    const pass = new stream.PassThrough();
    const cld = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    pass.end(buffer);
    pass.pipe(cld);
  });

const parseTags = (t) =>
  Array.isArray(t)
    ? t
    : (t || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

export const createDiscovery = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Validation failed", details: errors.array() });

    const data = matchedData(req);
    let thumbnail;

    if (req.file?.buffer) {
      const up = await uploadBufferToCloudinary(req.file.buffer);
      thumbnail = {
        url: up.secure_url,
        publicId: up.public_id,
        width: up.width,
        height: up.height,
        format: up.format,
      };
    }

    const doc = await Discovery.create({
      title: data.title,
      description: data.description,
      category: data.category,
      tags: parseTags(data.tags),
      readMoreUrl: data.readMoreUrl,
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
      thumbnail,
      author: req.user._id,
    });

    res.status(201).json({ data: doc });
  } catch (err) {
    res.status(500).json({ error: "Failed to create discovery", detail: err.message });
  }
};

export const listDiscoveries = async (req, res) => {
  try {
    const { q, category, tag, published, sort = "-createdAt", page = 1, limit = 12 } = req.query;

    const where = {};
    if (q) {
      where.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $elemMatch: { $regex: q, $options: "i" } } },
      ];
    }
    if (category) where.category = category;
    if (tag) where.tags = { $in: [tag] };
    if (published === "true") where.isPublished = true;
    if (published === "false") where.isPublished = false;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);

    const [items, total] = await Promise.all([
      Discovery.find(where)
        .populate("author", "firstName lastName role")
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Discovery.countDocuments(where),
    ]);

    res.json({ data: items, meta: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch list", detail: err.message });
  }
};

export const getDiscovery = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const doc =
      (await Discovery.findOne({ slug: idOrSlug }).populate("author", "firstName lastName role")) ||
      (await Discovery.findById(idOrSlug).populate("author", "firstName lastName role"));

    if (!doc) return res.status(404).json({ error: "Discovery not found" });
    res.json({ data: doc });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch discovery", detail: err.message });
  }
};

export const updateDiscovery = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Validation failed", details: errors.array() });

    const data = matchedData(req, { includeOptionals: true });
    const doc = await Discovery.findById(id);
    if (!doc) return res.status(404).json({ error: "Discovery not found" });

    if (data.title) doc.title = data.title;
    if (data.description) doc.description = data.description;
    if (data.category) doc.category = data.category;
    if (data.tags !== undefined) doc.tags = parseTags(data.tags);
    if (data.readMoreUrl !== undefined) doc.readMoreUrl = data.readMoreUrl;
    if (data.isPublished !== undefined) doc.isPublished = data.isPublished;

    if (req.file?.buffer) {
      if (doc.thumbnail?.publicId) {
        try { await cloudinary.uploader.destroy(doc.thumbnail.publicId); } catch {}
      }
      const up = await uploadBufferToCloudinary(req.file.buffer);
      doc.thumbnail = {
        url: up.secure_url,
        publicId: up.public_id,
        width: up.width,
        height: up.height,
        format: up.format,
      };
    }

    await doc.save();
    res.json({ data: doc });
  } catch (err) {
    res.status(500).json({ error: "Failed to update discovery", detail: err.message });
  }
};

export const deleteDiscovery = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Discovery.findById(id);
    if (!doc) return res.status(404).json({ error: "Discovery not found" });

    if (doc.thumbnail?.publicId) {
      try { await cloudinary.uploader.destroy(doc.thumbnail.publicId); } catch {}
    }
    await doc.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete discovery", detail: err.message });
  }
};
