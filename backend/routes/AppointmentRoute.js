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

