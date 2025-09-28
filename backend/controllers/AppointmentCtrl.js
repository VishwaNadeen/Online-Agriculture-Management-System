// backend/controllers/AppointmentCtrl.js
import mongoose from "mongoose";
import AppointmentModel from "../models/AppointmentModel.js";
import User from "../models/userModel.js";
import { sendMail } from "../services/mailService.js";
import { EmailTpl } from "../utils/emailTemplates.js";
import { notify } from "../services/notificationService.js";

/* ---------------------------------------------
 * Helpers: auth + roles
 * --------------------------------------------- */
function authUserId(req) {
  return req.user?.id || req.user?._id || req.user?.sub || null;
}
function isAdmin(req) {
  const r = req.user?.role;
  if (!r) return false;
  return Array.isArray(r) ? r.includes("admin") : r === "admin";
}

/* ---------------------------------------------
 * What clients may send
 * --------------------------------------------- */
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
  // "status"  <-- blocked for non-admin in generic update
  "consultantId",
  "consultantName",
];

const REQUIRED_ON_CREATE = [
  "name",
  "phone",
  "email",
  "state",
  "city",
  "category",
  "appointmentDate",
  "appointmentTime",
  "consultantId",   // now required (not only name)
];

/* period → canonical HH:mm */
const PERIOD_TO_TIME = { morning: "09:00", afternoon: "14:00", evening: "18:00" };
const PERIODS = new Set(Object.keys(PERIOD_TO_TIME));

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  return out;
}

function normalize(input) {
  const data = { ...input };

  for (const k of ["name","phone","email","state","city","address","category","notes","consultantName"]) {
    if (typeof data[k] === "string") data[k] = data[k].trim();
  }

  // Date (accept YYYY-MM-DD or ISO)
  if (data.appointmentDate && typeof data.appointmentDate === "string") {
    // Keep simple: treat as local midnight. If you prefer UTC normalize, adjust here.
    data.appointmentDate = new Date(data.appointmentDate);
  }

  // Time
  if (data.appointmentTime != null) {
    const t = String(data.appointmentTime).toLowerCase();
    if (PERIODS.has(t)) data.appointmentTime = PERIOD_TO_TIME[t];
  }

  // Duration
  if (data.durationHours != null) {
    const n = Number(data.durationHours);
    data.durationHours = Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  }

  return data;
}

function fieldErrors(err) {
  if (!err?.errors) return undefined;
  const out = {};
  for (const [k, v] of Object.entries(err.errors)) out[k] = v.message;
  return out;
}

/* ---------------------------------------------
 * Ownership / visibility guards
 * - farmer owner: appointment.userId === me
 * - assigned consultant: appointment.consultantId === me
 * - admin: bypass
 * --------------------------------------------- */
function buildReadCriteria(req, base = {}) {
  if (isAdmin(req)) return base;

  const me = authUserId(req);
  if (!me) return null;

  // Either the booking owner OR the assigned consultant
  return { ...base, $or: [{ userId: me }, { consultantId: me }] };
}

/* ===================== CREATE ===================== */
export async function createAppointment(req, res) {
  try {
    const me = authUserId(req); // may be undefined for public booking

    const raw = pick(req.body, ALLOWED_FIELDS);

    // presence check
    for (const f of REQUIRED_ON_CREATE) {
      const val = raw[f];
      if (val == null || (typeof val === "string" && val.trim() === "")) {
        return res.status(400).json({ message: `Missing required field: ${f}` });
      }
    }

    const data = normalize(raw);
    if (me) data.userId = me; // set owner if logged in; otherwise allow anonymous
    data.status = "pending"; // enforce new bookings start as pending

    // sanity: consultantId must be a valid ObjectId
    if (!mongoose.isValidObjectId(data.consultantId)) {
      return res.status(400).json({ message: "Invalid consultantId" });
    }

    const doc = await AppointmentModel.create(data);

    // Optional email: notify consultant about new request
    try {
      const consultant = await User.findById(data.consultantId).lean();
      if (consultant?.email) {
        const dateStr = new Date(doc.appointmentDate).toUTCString();
        const farmer = await User.findById(me).lean();
        await sendMail(
          EmailTpl.created(
            farmer?.firstName || data.name || "User",
            dateStr,
            consultant.email,
            doc._id
          )
        );
      }
    } catch (e) {
      // log email error silently
    }

    return res.status(201).json({ message: "Appointment created", appointment: doc });
  } catch (err) {
    console.error("❌ createAppointment:", err);
    return res.status(400).json({
      message: "Invalid appointment data",
      error: err.message,
      errors: fieldErrors(err),
    });
  }
}

/* ===================== LISTS ===================== */
/** Farmer view: only my bookings (as the one who created) */
export async function listMyAppointments(req, res) {
  try {
    const me = authUserId(req);
    if (!me) return res.status(401).json({ message: "Not authenticated" });

    const { status, q: text } = req.query || {};
    const q = { userId: me };
    if (status) q.status = status;

    // optional text search across a few fields
    if (text && String(text).trim() !== "") {
      const t = String(text).trim();
      const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      q.$or = [
        { name: re },
        { email: re },
        { phone: re },
        { city: re },
        { category: re },
        // allow human id search; cast number to string compare via $expr
        { $expr: { $regexMatch: { input: { $toString: "$appointmentId" }, regex: re } } },
      ];
    }

    const items = await AppointmentModel.find(q).sort({ appointmentDate: -1 }).lean();
    return res.status(200).json(items);
  } catch (err) {
    console.error("❌ listMyAppointments:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Consultant view: appointments assigned to me (as consultant) */
export async function listMyConsultantAppointments(req, res) {
  try {
    const me = authUserId(req);
    if (!me) return res.status(401).json({ message: "Not authenticated" });

    const { status, q: text } = req.query || {};
    const q = { consultantId: me };
    if (status) q.status = status;

    // optional text search across client details and category/city/appointmentId
    if (text && String(text).trim() !== "") {
      const t = String(text).trim();
      const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      q.$or = [
        { name: re },
        { email: re },
        { phone: re },
        { city: re },
        { category: re },
        { $expr: { $regexMatch: { input: { $toString: "$appointmentId" }, regex: re } } },
      ];
    }

    const items = await AppointmentModel.find(q).sort({ appointmentDate: -1 }).lean();
    return res.status(200).json(items);
  } catch (err) {
    console.error("❌ listMyConsultantAppointments:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Admin (all) or scoped (owner/consultant) with pagination */
export async function getAllAppointments(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "10", 10)));
    const skip = (page - 1) * limit;

    const baseFilter = {};
    if (req.query.status) baseFilter.status = req.query.status;

    const criteria = buildReadCriteria(req, baseFilter);
    if (!criteria) return res.status(401).json({ message: "Not authenticated" });

    const [items, total] = await Promise.all([
      AppointmentModel.find(criteria).sort({ appointmentDate: -1 }).skip(skip).limit(limit).lean(),
      AppointmentModel.countDocuments(criteria),
    ]);

    return res.status(200).json({
      appointments: items,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    console.error("❌ getAllAppointments:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ===================== READ ONE ===================== */
export async function getAppointmentById(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid appointment id" });
  }
  try {
    const criteria = buildReadCriteria(req, { _id: id });
    if (!criteria) return res.status(401).json({ message: "Not authenticated" });

    const appointment = await AppointmentModel.findOne(criteria);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    return res.status(200).json({ appointment });
  } catch (err) {
    console.error("❌ getAppointmentById:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ===================== GENERIC UPDATE ===================== */
export async function updateAppointment(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid appointment id" });
  }

  const raw = pick(req.body, ALLOWED_FIELDS);
  const update = normalize(raw);

  try {
    const criteria = buildReadCriteria(req, { _id: id });
    if (!criteria) return res.status(401).json({ message: "Not authenticated" });

    // ❗ Don’t allow non-admins to change status via generic update
    if (!isAdmin(req)) {
      delete update.status;
      delete update.declineReason; // status-driven only
      delete update.events;        // protected
      delete update.userId;        // protected
    }

    const appointment = await AppointmentModel.findOneAndUpdate(criteria, update, {
      new: true,
      runValidators: true,
    });
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    return res.status(200).json({ message: "Appointment updated", appointment });
  } catch (err) {
    console.error("❌ updateAppointment:", err);
    return res.status(400).json({
      message: "Invalid appointment data",
      error: err.message,
      errors: fieldErrors(err),
    });
  }
}

/* ===================== DELETE ===================== */
export async function deleteAppointment(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid appointment id" });
  }
  try {
    const criteria = buildReadCriteria(req, { _id: id });
    if (!criteria) return res.status(401).json({ message: "Not authenticated" });

    const appointment = await AppointmentModel.findOne(criteria);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    await appointment.deleteOne();
    return res.status(200).json({ message: "Appointment deleted", appointment });
  } catch (err) {
    console.error("❌ deleteAppointment:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ===================== ACTIONS: confirm / decline / cancel / complete ===================== */
function fmtEmailDate(d) {
  return new Date(d).toUTCString();
}

/** Consultant → Confirm */
export async function confirmAppointment(req, res) {
  const { id } = req.params;
  const me = authUserId(req);
  if (!me) return res.status(401).json({ message: "Not authenticated" });
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });

  const appt = await AppointmentModel.findById(id);
  if (!appt) return res.status(404).json({ message: "Not found" });
  if (String(appt.consultantId) !== String(me) && !isAdmin(req))
    return res.status(403).json({ message: "Not your appointment" });

  if (appt.status !== "pending")
    return res.status(400).json({ message: "Only pending can be confirmed" });

  appt.status = "confirmed";
  appt.events.push({ action: "confirmed", byUser: me });
  await appt.save();

  // email + notify farmer
  try {
    const farmer = await User.findById(appt.userId).lean();
    const consultant = await User.findById(appt.consultantId).lean();
    if (farmer?.email) {
      await sendMail(
        EmailTpl.confirmed(
          consultant?.firstName || "Consultant",
          fmtEmailDate(appt.appointmentDate),
          farmer.email,
          appt._id
        )
      );
    }
    await notify(
      appt.userId,
      "Appointment confirmed",
      `Your appointment on ${fmtEmailDate(appt.appointmentDate)} was confirmed.`,
      appt._id
    );
  } catch (e) {}

  return res.json({ ok: true, status: appt.status });
}

/** Consultant → Decline */
export async function declineAppointment(req, res) {
  const { id } = req.params;
  const { reason } = req.body || {};
  const me = authUserId(req);
  if (!me) return res.status(401).json({ message: "Not authenticated" });
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });

  const appt = await AppointmentModel.findById(id);
  if (!appt) return res.status(404).json({ message: "Not found" });
  if (String(appt.consultantId) !== String(me) && !isAdmin(req))
    return res.status(403).json({ message: "Not your appointment" });

  if (appt.status !== "pending")
    return res.status(400).json({ message: "Only pending can be declined" });

  appt.status = "declined";
  appt.declineReason = (reason || "").trim();
  appt.events.push({ action: "declined", byUser: me, note: appt.declineReason });
  await appt.save();

  try {
    const farmer = await User.findById(appt.userId).lean();
    const consultant = await User.findById(appt.consultantId).lean();
    if (farmer?.email) {
      await sendMail(
        EmailTpl.declined(
          consultant?.firstName || "Consultant",
          fmtEmailDate(appt.appointmentDate),
          farmer.email,
          appt.declineReason,
          appt._id
        )
      );
    }
    await notify(
      appt.userId,
      "Appointment declined",
      `Your request for ${fmtEmailDate(appt.appointmentDate)} was declined.`,
      appt._id
    );
  } catch (e) {}

  return res.json({ ok: true, status: appt.status });
}

/** Farmer → Cancel (pending or confirmed) */
export async function cancelAppointment(req, res) {
  const { id } = req.params;
  const me = authUserId(req);
  if (!me) return res.status(401).json({ message: "Not authenticated" });
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });

  const appt = await AppointmentModel.findById(id);
  if (!appt) return res.status(404).json({ message: "Not found" });
  if (String(appt.userId) !== String(me) && !isAdmin(req))
    return res.status(403).json({ message: "Only the booking user can cancel" });

  if (!["pending", "confirmed"].includes(appt.status))
    return res.status(400).json({ message: "Only pending/confirmed can be cancelled" });

  appt.status = "cancelled";
  appt.events.push({ action: "cancelled", byUser: me });
  await appt.save();

  try {
    const farmer = await User.findById(appt.userId).lean();
    const consultant = await User.findById(appt.consultantId).lean();
    if (consultant?.email) {
      await sendMail(
        EmailTpl.cancelled(
          farmer?.firstName || "User",
          fmtEmailDate(appt.appointmentDate),
          consultant.email,
          appt._id
        )
      );
    }
    await notify(
      appt.consultantId,
      "Appointment cancelled",
      `The booking for ${fmtEmailDate(appt.appointmentDate)} was cancelled by the user.`,
      appt._id
    );
  } catch (e) {}

  return res.json({ ok: true, status: appt.status });
}

/** (Optional) Either side / Admin → Mark completed */
export async function completeAppointment(req, res) {
  const { id } = req.params;
  const me = authUserId(req);
  if (!me) return res.status(401).json({ message: "Not authenticated" });
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });

  const appt = await AppointmentModel.findById(id);
  if (!appt) return res.status(404).json({ message: "Not found" });

  // allow: consultant, farmer, or admin
  const isOwner =
    String(appt.userId) === String(me) || String(appt.consultantId) === String(me) || isAdmin(req);
  if (!isOwner) return res.status(403).json({ message: "Not permitted" });

  if (!["confirmed"].includes(appt.status))
    return res.status(400).json({ message: "Only confirmed can be completed" });

  appt.status = "completed";
  appt.events.push({ action: "completed", byUser: me });
  await appt.save();

  // in-app notifications only (email not necessary here)
  try {
    await notify(appt.userId, "Appointment completed", "Your appointment was marked as completed.", appt._id);
    await notify(appt.consultantId, "Appointment completed", "Appointment marked as completed.", appt._id);
  } catch (e) {}

  return res.json({ ok: true, status: appt.status });
}
