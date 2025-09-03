/**
 * backend/routes/CommunityRoutes.js
 *
 * Express routes for Green Grow community posts.
 * Mount in server: app.use("/community", communityRoutes)
 */

import express from "express";
import * as ctrl from "../controllers/CommunityCtrl.js";

const router = express.Router();

// Optional auth stub (replace with your real middleware)
const requireAuth = (req, _res, next) => {
  if (!req.user && process.env.REQUIRE_AUTH === "true") {
    const err = new Error("Unauthorized");
    err.status = 401;
    return next(err);
  }
  return next();
};

// Create
router.post("/", requireAuth, ctrl.createPost);

// Read
router.get("/", ctrl.listPosts); // filters, pagination, search, geo
router.get("/:id", ctrl.getPostById);

// Update
router.patch("/:id", requireAuth, ctrl.updatePost);

// Soft delete
router.delete("/:id", requireAuth, ctrl.softDeletePost);

// Community actions
router.post("/:id/vote", requireAuth, ctrl.votePost);
router.post("/:id/accept-answer", requireAuth, ctrl.acceptAnswer);

// Moderation
router.post("/:id/flag", requireAuth, ctrl.flagPost);
router.post("/:id/unflag", requireAuth, ctrl.unflagPost);

export default router;
