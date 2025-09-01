import express from "express";
import {
  getAllAppointments,
  createAppointment,
   getAppointmentById, 
    updateAppointment,
      deleteAppointment, 
} from "../controllers/AppointmentCtrl.js";

const router = express.Router();

router.get("/", getAllAppointments);
router.post("/", createAppointment);
router.get("/:id", getAppointmentById); 
router.patch("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);

export default router;

//PUT = full replace (send the entire appointment). Idempotent.

//PATCH = partial update (send only the fields you want to change).