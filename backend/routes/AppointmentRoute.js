// backend/routes/appointmentRoutes.js
import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  listMyAppointments, // ADD
  listMyConsultantAppointments,
  confirmAppointment,
  declineAppointment,
  cancelAppointment,
  completeAppointment,
} from "../controllers/AppointmentCtrl.js";
import { requireAuth } from "../middlewares/auth.js"; // auth middleware

const router = express.Router();

// Create — require auth so controller can set userId from JWT (model requires userId)
router.post("/", requireAuth, createAppointment);

// All routes below also require authentication
router.use(requireAuth);

// Read only my appointments (used by frontend "My Appointments")
router.get("/my", listMyAppointments); // authenticated by router.use
router.get("/my-consultant", listMyConsultantAppointments);

// Admin-specific route to get ALL appointments (no filters) - MUST BE BEFORE /:id
router.get("/admin/all", async (req, res) => {
  try {
    console.log("🔵 /admin/all called by user:", req.user?.role);
    
    // Check if user is admin
    const isAdmin = req.user?.role === "admin";
    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access only" });
    }
    
    const AppointmentModel = (await import("../models/AppointmentModel.js")).default;
    const appointments = await AppointmentModel.find({}).sort({ appointmentDate: -1 }).limit(10000).lean();
    
    console.log("🔵 Found", appointments.length, "total appointments for admin");
    
    return res.status(200).json(appointments);
  } catch (err) {
    console.error("❌ /admin/all error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Read all (admin sees all; normal user sees only own due to controller logic)
router.get("/", getAllAppointments);

// Read one (owner or admin)
router.get("/:id", getAppointmentById);

// Update (owner or admin)
router.patch("/:id", updateAppointment);
router.put("/:id", updateAppointment);

// Delete (owner or admin)
router.delete("/:id", deleteAppointment);

// actions
router.post("/:id/confirm", confirmAppointment);
router.post("/:id/decline", declineAppointment);
router.post("/:id/cancel", cancelAppointment);
router.post("/:id/complete", completeAppointment);

export default router;

