// routes/userRoutes.js
import { Router } from "express";
import mongoose from "mongoose";
import userCtrl from "../controllers/userCtrl.js";

const router = Router();

// quick validator for :id params
const validateId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  next();
};

// Auth & CRUD
router.post("/", userCtrl.create);                // Create/register user
router.post("/login", userCtrl.login);            // Login

router.get("/", userCtrl.list);                   // List/search users
router.get("/:id", validateId, userCtrl.get);     // Get one user

router.patch("/:id", validateId, userCtrl.update);                 // Update user (no password)
router.patch("/:id/password", validateId, userCtrl.changePassword); // Change password

router.delete("/:id", validateId, userCtrl.remove); // Delete user

export default router;