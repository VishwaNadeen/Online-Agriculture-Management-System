// backend/routes/appointmentRoutes.js
import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  listMyAppointments, // ADD
} from "../controllers/AppointmentCtrl.js";
import { requireAuth } from "../middlewares/auth.js"; // CHANGE: protect routes

const router = express.Router();

// All appointment routes require login
router.use(requireAuth); // CHANGE: everything below is authenticated

// Create
router.post("/", createAppointment);

// Read only my appointments (used by frontend "My Appointments")
router.get("/my", listMyAppointments); // ADD

// Read all (admin sees all; normal user sees only own due to controller logic)
router.get("/", getAllAppointments);

// Read one (owner or admin)
router.get("/:id", getAppointmentById);

// Update (owner or admin)
router.patch("/:id", updateAppointment);
router.put("/:id", updateAppointment);

// Delete (owner or admin)
router.delete("/:id", deleteAppointment);

export default router;
