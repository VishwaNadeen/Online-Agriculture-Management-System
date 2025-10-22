// routes/userRoutes.js
import { Router } from "express";
import mongoose from "mongoose";
import multer from "multer";
import cloudinary from "../config/cloudinary.js"; // default import
import userCtrl, {
  // reset flow handlers
  requestPasswordReset,
  verifyPasswordCode,
  setNewPassword,
} from "../controllers/userCtrl.js";
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
        format: ext === "jpeg" ? "jpg" : ext, // normalize jpeg → jpg
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

/* ---------------- Public Password Reset ---------------- */
// 1) send code
router.post("/password/forgot", requestPasswordReset);
// 2) verify code (optional separate step)
router.post("/password/verify", verifyPasswordCode);
// 3) set new password (requires email+code+newPassword)
router.post("/password/reset", setNewPassword);

/* ---------------- Public Routes ---------------- */
// Registration
router.post("/userRegistration", upload.single("profile"), async (req, res) => {
  try {
    // accept either plain fields or a `data` JSON blob (from multipart forms)
    const payload = req.body?.data ? JSON.parse(req.body.data) : (req.body || {});

    // optional profile image -> Cloudinary
    if (req.file?.buffer) {
      const up = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
      payload.profilePicture = up.secure_url;
    }

    // forward normalized body to controller
    req.body = payload;
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
router.patch("/:id", validateId, requireAuth, selfOrAdmin(), userCtrl.update);
router.patch("/:id/password", validateId, requireAuth, selfOrAdmin(), userCtrl.changePassword);
router.delete("/:id", validateId, requireAuth, selfOrAdmin(), userCtrl.remove);

export default router;
