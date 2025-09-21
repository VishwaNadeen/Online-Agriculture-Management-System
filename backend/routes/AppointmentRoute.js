// backend/routes/appointmentRoutes.js
import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
} from "../controllers/AppointmentCtrl.js";

const router = express.Router();

// If you later want auth, add: import { requireAuth } from "../middlewares/auth.js";

router.post("/", createAppointment);     // Create
router.get("/", getAllAppointments);     // Read all (supports ?page=&limit=&status=)
router.get("/:id", getAppointmentById);  // Read one
router.patch("/:id", updateAppointment); // Update (partial)
router.delete("/:id", deleteAppointment);// Delete

export default router;
