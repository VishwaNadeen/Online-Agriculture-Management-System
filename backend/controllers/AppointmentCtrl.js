// backend/controllers/AppointmentCtrl.js
import mongoose from "mongoose";
import AppointmentModel from "../models/AppointmentModel.js";

/** Allowed fields for create/update (CRUD only) */
const CREATE_FIELDS = [
  "name", "phone", "email",
  "state", "city", "address",
  "category",
  "appointmentDate", "appointmentTime",
  "durationHours", "notes", "status",
];
const UPDATE_FIELDS = [...CREATE_FIELDS]; // same set

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  return out;
}

// CREATE  (POST /appointments)
export async function createAppointment(req, res) {
  try {
    const data = pick(req.body, CREATE_FIELDS);
    const appointment = new AppointmentModel(data);
    await appointment.save();
    return res.status(201).json({ message: "Appointment created", appointment });
  } catch (err) {
    console.error("❌ Error creating appointment:", err);
    return res.status(400).json({ message: "Invalid appointment data", error: err.message });
  }
}

// READ ALL  (GET /appointments)
export async function getAllAppointments(req, res) {
  try {
    const appointments = await AppointmentModel.find().sort({ createdAt: -1 });

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ message: "No appointments found" });
    }
    return res.status(200).json({ appointments });
  } catch (err) {
    console.error("❌ Error fetching appointments:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// READ ONE by Mongo _id  (GET /appointments/:id)
export async function getAppointmentById(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid appointment id" });
  }

  try {
    const appointment = await AppointmentModel.findById(id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    return res.status(200).json({ appointment });
  } catch (err) {
    console.error("❌ Error fetching appointment by id:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// UPDATE (partial)  (PATCH /appointments/:id)
export async function updateAppointment(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid appointment id" });
  }
  const update = pick(req.body, UPDATE_FIELDS);
  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: "No valid fields to update" });
  }

  try {
    const appointment = await AppointmentModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    return res.status(200).json({ message: "Appointment updated", appointment });
  } catch (err) {
    console.error("❌ Error updating appointment:", err);
    return res.status(400).json({ message: "Invalid appointment data", error: err.message });
  }
}

// DELETE  (DELETE /appointments/:id)
export async function deleteAppointment(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid appointment id" });
  }
  
  try {
    const appointment = await AppointmentModel.findByIdAndDelete(id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    return res.status(200).json({ message: "Appointment deleted", appointment });
  } catch (err) {
    console.error("❌ Error deleting appointment:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
