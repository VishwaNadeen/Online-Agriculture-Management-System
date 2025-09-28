// routes/userRoutes.js
import { Router } from "express";
import mongoose from "mongoose";
import multer from "multer";
import cloudinary from "../config/cloudinary.js"; // <- use default import unless you truly export { cloudinary }
import userCtrl from "../controllers/userCtrl.js";
import { requireAuth, selfOrAdmin } from "../middlewares/auth.js";

const router = Router();

/* ---------- :id validator ---------- */
const validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  next();
};

/* ---------- Multer (memory) ---------- */
const upload = multer({ storage: multer.memoryStorage() });

/* ---------- Cloudinary: upload buffer helper ---------- */
const uploadBufferToCloudinary = (buffer, filename) =>
  new Promise((resolve, reject) => {
    const ext = (filename?.split(".").pop() || "jpg").toLowerCase();
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "greengrow/profiles",
        resource_type: "image",
        format: ext === "jpeg" ? "jpg" : ext,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

/* ---------------- Public Routes ---------------- */
// Registration
router.post("/userRegistration", upload.single("profile"), async (req, res) => {
  try {
    const payload = req.body?.data ? JSON.parse(req.body.data) : (req.body || {});

    if (req.file?.buffer) {
      const up = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
      payload.profilePicture = up.secure_url;
      // If you need to delete/replace later, also store public_id:
      // payload._profilePublicId = up.public_id;
    }

    req.body = payload; // forward normalized body to controller
    return userCtrl.create(req, res);
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(400).json({ message: "Bad payload", error: err.message });
  }
});

// Auth
router.post("/login", userCtrl.login);

// Public read
router.get("/", userCtrl.list);
router.get("/:id", validateId, userCtrl.get);

/* ---------------- Protected Routes ---------------- */
router.patch("/:id", validateId, requireAuth, selfOrAdmin, userCtrl.update);
router.patch("/:id/password", validateId, requireAuth, selfOrAdmin, userCtrl.changePassword);
router.delete("/:id", validateId, requireAuth, selfOrAdmin, userCtrl.remove);

export default router;