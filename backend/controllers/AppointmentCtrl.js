import AppointmentModel from "../models/AppointmentModel.js";
import mongoose from "mongoose";


// GET /appointments
export async function getAllAppointments(req, res) {
  try {
    const appointments = await AppointmentModel.find().sort({ createdAt: -1 });
    // you can return 200 with [] instead of 404 if you prefer:
    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ message: "No appointments found" });
    }
    res.status(200).json({ appointments });
  } catch (err) {
    console.error("❌ Error fetching appointments:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// POST /appointments
export async function createAppointment(req, res) {
  try {
    const appointment = new AppointmentModel(req.body);
    await appointment.save();
    res.status(201).json({ message: "Appointment created", appointment });
  } catch (err) {
    console.error("❌ Error creating appointment:", err);
    res
      .status(400)
      .json({ message: "Invalid appointment data", error: err.message });
  }
}

// GET /appointments/:id
export async function getAppointmentById(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid appointment id" });
  }

  try {
    const appointment = await AppointmentModel.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    return res.status(200).json({ appointment });
  } catch (err) {
    console.error("❌ Error fetching appointment by id:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


// PATCH /appointments/:id update
export async function updateAppointment(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid appointment id" });
  }

  // only allow fields defined in your schema
  const allowed = [
    "state",
    "city",
    "address",
    "appointmentDate",
    "appointmentTime",
    "durationHours",
    "notes",
    "status",
  ];
  const update = {};
  for (const key of allowed) {
    if (key in req.body) update[key] = req.body[key];
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: "No valid fields to update" });
  }

  try {
    const appointment = await AppointmentModel.findByIdAndUpdate(id, update, {
      new: true,          // return updated doc
      runValidators: true // enforce schema validators on update
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    return res.status(200).json({ message: "Appointment updated", appointment });
  } catch (err) {
    console.error("❌ Error updating appointment:", err);
    return res.status(400).json({ message: "Invalid appointment data", error: err.message });
  }
}

export async function deleteAppointment(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid appointment id" });
  }

  try {
    const appointment = await AppointmentModel.findByIdAndDelete(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    return res.status(200).json({ message: "Appointment deleted", appointment });
  } catch (err) {
    console.error("❌ Error deleting appointment:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
