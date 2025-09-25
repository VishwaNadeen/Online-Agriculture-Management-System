// routes/CommunityRoute.js
import { Router } from "express";
import communityCtrl from "../controllers/CommunityCtrl.js"; // ⚠️ exact filename case

const router = Router();

// Posts CRUD
router.post("/", communityCtrl.create);
router.get("/", communityCtrl.list);
router.get("/:id", communityCtrl.get);
router.put("/:id", communityCtrl.update);
router.delete("/:id", communityCtrl.remove);

// Comments
router.post("/:id/comments", communityCtrl.addComment);

// Replies (nested under a comment)
router.post("/:id/comments/:commentId/replies", communityCtrl.addReplyToComment);

// Upvote
router.post("/:id/upvote", communityCtrl.upvote);

export default router;
