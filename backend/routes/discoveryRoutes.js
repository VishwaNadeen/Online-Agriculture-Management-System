import { Router } from "express";
import { body, query } from "express-validator";
import {
  createDiscovery,
  listDiscoveries,
  getDiscovery,
  updateDiscovery,
  deleteDiscovery,
} from "../controllers/discoveryCtrl.js";
import { upload } from "../middlewares/upload.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

const createRules = [
  body("title").trim().isLength({ min: 3 }),
  body("description").trim().isLength({ min: 10 }),
  body("category").optional().trim().isLength({ min: 2 }),
  body("tags").optional().isString(),
  body("readMoreUrl").optional().isURL(),
  body("isPublished").optional().isBoolean(),
];

const updateRules = [
  body("title").optional().trim().isLength({ min: 3 }),
  body("description").optional().trim().isLength({ min: 10 }),
  body("category").optional().trim().isLength({ min: 2 }),
  body("tags").optional().isString(),
  body("readMoreUrl").optional().isURL(),
  body("isPublished").optional().isBoolean(),
];

const listRules = [
  query("q").optional().isString(),
  query("category").optional().isString(),
  query("tag").optional().isString(),
  query("published").optional().isIn(["true", "false"]),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("sort").optional().isString(),
];

// public
router.get("/", listRules, listDiscoveries);
router.get("/:idOrSlug", getDiscovery);

// admin-only (field name for image: thumbnail)
router.post("/", requireAuth, requireRole("admin"), upload.single("thumbnail"), createRules, createDiscovery);
router.put("/:id", requireAuth, requireRole("admin"), upload.single("thumbnail"), updateRules, updateDiscovery);
router.delete("/:id", requireAuth, requireRole("admin"), deleteDiscovery);

export default router;
