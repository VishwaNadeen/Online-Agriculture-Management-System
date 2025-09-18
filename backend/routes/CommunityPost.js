// routes/communityRoutes.js
import { Router } from "express";
import communityCtrl from "../controllers/CommunityCtrl.js"; // ⚠️ check filename case

const router = Router();

// ===== POSTS CRUD =====
router.post("/", communityCtrl.create);     // Create a post
router.get("/", communityCtrl.list);        // Get all posts
router.get("/:id", communityCtrl.get);      // Get one post by ID
router.put("/:id", communityCtrl.update);   // Update a post
router.delete("/:id", communityCtrl.remove);// Delete a post

// ===== REPLIES =====
router.get("/:id/replies", communityCtrl.listReplies);           // List replies for a post
router.post("/:id/replies", communityCtrl.addReply);             // Add a reply
router.put("/:id/replies/:replyId", communityCtrl.updateReply);  // Update a reply
router.delete("/:id/replies/:replyId", communityCtrl.deleteReply);// Delete a reply

export default router;