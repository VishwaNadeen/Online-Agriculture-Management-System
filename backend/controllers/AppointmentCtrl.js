// backend/controllers/AppointmentCtrl.js
import mongoose from "mongoose";
import AppointmentModel from "../models/AppointmentModel.js";

/** Fields we allow from clients */
const ALLOWED_FIELDS = [
  "name",
  "phone",
  "email",
  "state",
  "city",
  "address",
  "category",
  "appointmentDate",
  "appointmentTime",
  "durationHours",
  "notes",
  "status",
    "consultantId",   // ADD
  "consultantName", // ADD
  // NOTE: userId is intentionally NOT allowed from client (we set it from JWT)
];

/** Minimal required fields on CREATE (schema should also enforce) */
const REQUIRED_ON_CREATE = [
  "name",
  "phone",
  "email",
  "state",
  "city",
  "category",
  "appointmentDate",
  "appointmentTime",
  "consultantName",
];


/** Allow “period” values from UI and map them to canonical HH:mm */
const PERIOD_TO_TIME = { morning: "09:00", afternoon: "14:00", evening: "18:00" };
const PERIODS = new Set(Object.keys(PERIOD_TO_TIME));

/** Utility: safe pick */
function pick(obj, keys) {
  const out = {};
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  }
  return out;
}

/** Normalize/clean incoming data. Accepts both “period” and “HH:mm”. */
function normalize(input) {
  const data = { ...input };

  // Trim common strings
  for (const k of [
    "name",
    "phone",
    "email",
    "state",
    "city",
    "address",
    "category",
    "notes",
    "status",
  ]) {
    if (typeof data[k] === "string") data[k] = data[k].trim();
  }

  // Date: accept "YYYY-MM-DD" → Date object
  if (data.appointmentDate && typeof data.appointmentDate === "string") {
    // Set to local midnight; switch to UTC if your app prefers UTC semantics
    data.appointmentDate = new Date(`${data.appointmentDate}T00:00`);
  }

  // Time: accept “morning/afternoon/evening” or “HH:mm”
  if (data.appointmentTime != null) {
    const t = String(data.appointmentTime).toLowerCase();
    if (PERIODS.has(t)) data.appointmentTime = PERIOD_TO_TIME[t];
    // else leave as-is; schema will validate HH:mm format
  }

  // Duration
  if (data.durationHours != null) {
    const n = Number(data.durationHours);
    data.durationHours = Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  }

  // Default status
  if (!data.status) data.status = "pending";

  return data;
}

/** Extract per-field validation messages from Mongoose errors */
function fieldErrors(err) {
  if (!err?.errors) return undefined;
  const out = {};
  for (const [k, v] of Object.entries(err.errors)) out[k] = v.message;
  return out;
}

/* ===================== CREATE (POST /appointments) ===================== */
export async function createAppointment(req, res) {
  try {
    // ADD: make sure we have an authenticated user (route uses requireAuth, but double-safety)
    const userId = req.user?.sub; // CHANGE: get owner from JWT's `sub`
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const raw = pick(req.body, ALLOWED_FIELDS);

    // Quick presence check (schema also validates)
    for (const f of REQUIRED_ON_CREATE) {
      const val = raw[f];
      if (val == null || (typeof val === "string" && val.trim() === "")) {
        return res.status(400).json({ message: `Missing required field: ${f}` });
      }
    }

    const data = normalize(raw);

    // ADD: force owner from token, ignore any userId from client
    data.userId = userId; // CHANGE

    const doc = await AppointmentModel.create(data);

    return res.status(201).json({ message: "Appointment created", appointment: doc });
  } catch (err) {
    console.error("❌ Error creating appointment:", err);
    return res.status(400).json({
      message: "Invalid appointment data",
      error: err.message,
      errors: fieldErrors(err),
    });
  }
}

/* ===== READ MINE (GET /appointments/my) — only my appointments ===== */
export async function listMyAppointments(req, res) {
  try {
    const userId = req.user?.sub; // CHANGE
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const items = await AppointmentModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(items);
  } catch (err) {
    console.error("❌ Error fetching my appointments:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ===== READ ALL (GET /appointments) — admin gets all; user gets only own ===== */
export async function getAllAppointments(req, res) {
  try {
    const role = req.user?.role; // CHANGE
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "10", 10)));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    // CHANGE: if not admin, scope to own records
    if (role !== "admin") {
      const userId = req.user?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      filter.userId = userId; // CHANGE
    }

    const [items, total] = await Promise.all([
      AppointmentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AppointmentModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      appointments: items,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    console.error("❌ Error fetching appointments:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ============ READ ONE (GET /appointments/:id) — only owner or admin ============ */
export async function getAppointmentById(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid appointment id" });
  }

  try {
    const role = req.user?.role;         // CHANGE
    const userId = req.user?.sub;        // CHANGE

    // CHANGE: enforce ownership unless admin
    const criteria = role === "admin" ? { _id: id } : { _id: id, userId };

    const appointment = await AppointmentModel.findOne(criteria);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    return res.status(200).json({ appointment });
  } catch (err) {
    console.error("❌ Error fetching appointment by id:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ============ UPDATE (PATCH/PUT /appointments/:id) — only owner or admin ============ */
export async function updateAppointment(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid appointment id" });
  }

  const updateRaw = pick(req.body, ALLOWED_FIELDS);
  if (Object.keys(updateRaw).length === 0) {
    return res.status(400).json({ message: "No valid fields to update" });
  }
  const update = normalize(updateRaw);

  try {
    const role = req.user?.role;   // CHANGE
    const userId = req.user?.sub;  // CHANGE

    // CHANGE: enforce ownership unless admin
    const criteria = role === "admin" ? { _id: id } : { _id: id, userId };

    const appointment = await AppointmentModel.findOneAndUpdate(criteria, update, {
      new: true,
      runValidators: true,
    });
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    return res.status(200).json({ message: "Appointment updated", appointment });
  } catch (err) {
    console.error("❌ Error updating appointment:", err);
    return res.status(400).json({
      message: "Invalid appointment data",
      error: err.message,
      errors: fieldErrors(err),
    });
  }
}

/* ============ DELETE (DELETE /appointments/:id) — only owner or admin ============ */
export async function deleteAppointment(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid appointment id" });
  }

  try {
    const role = req.user?.role;   // CHANGE
    const userId = req.user?.sub;  // CHANGE

    // CHANGE: enforce ownership unless admin
    const criteria = role === "admin" ? { _id: id } : { _id: id, userId };

    const appointment = await AppointmentModel.findOne(criteria);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    await appointment.deleteOne();
    return res.status(200).json({ message: "Appointment deleted", appointment });
  } catch (err) {
    console.error("❌ Error deleting appointment:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
