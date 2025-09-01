
import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
} from "../controllers/AppointmentCtrl.js";

const router = express.Router();

// CRUD only
router.post("/", createAppointment);     // Create
router.get("/", getAllAppointments);     // Read all
router.get("/:id", getAppointmentById);  // Read one
router.patch("/:id", updateAppointment); // Update (partial)
router.delete("/:id", deleteAppointment);// Delete

export default router;
