// backend/controllers/AppointmentCtrl.js
import mongoose from "mongoose";
import { z } from "zod";
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
const ensureEvents = (appt) => {
  if (!Array.isArray(appt.events)) appt.events = [];
  return appt;
};
const fmtEmailDate = (d) =>
  new Date(d).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/* ---------------------------------------------
 * Validation Schemas (Zod)
 * - Keep backend as the source of truth.
 * --------------------------------------------- */
const PERIOD_TO_TIME = { morning: "09:00", afternoon: "14:00", evening: "18:00" };
const PERIODS = new Set(Object.keys(PERIOD_TO_TIME));

const phoneAny = z
  .string()
  .trim()
  .min(8, "Phone number is too short")
  .max(25, "Phone number is too long");

const timeHHMM = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be HH:mm")
  .refine((t) => {
    const [h, m] = t.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return false;
    // business window 06:00–22:00
    return h >= 6 && (h < 22 || (h === 22 && m === 0));
  }, "Appointments available between 06:00 and 22:00");

const appointmentCreateSchema = z.object({
  name: z.string().trim().min(2).max(50),
  phone: phoneAny,
  email: z.string().trim().toLowerCase().email(),
  state: z.string().trim().min(2).max(50),
  city: z.string().trim().min(2).max(50),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  category: z.string().trim().min(2).max(80),

  // Accept either ISO Date string or Date
  appointmentDate: z.union([z.string().datetime(), z.date()]),
  // Either period ("morning"/"afternoon"/"evening") or HH:mm
  appointmentTime: z.union([
    z.enum(["morning", "afternoon", "evening"]),
    timeHHMM,
  ]),

  durationHours: z.coerce.number().int().min(1).max(8).optional().default(1),
  notes: z.string().max(1000).optional().or(z.literal("")),
  consultantId: z.string().refine((v) => mongoose.isValidObjectId(v), "Invalid consultantId"),
  consultantName: z.string().trim().max(120).optional(),
});

const appointmentUpdateSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  phone: phoneAny.optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  state: z.string().trim().min(2).max(50).optional(),
  city: z.string().trim().min(2).max(50).optional(),
  address: z.string().trim().max(200).optional(),
  category: z.string().trim().min(2).max(80).optional(),
  appointmentDate: z.union([z.string().datetime(), z.date()]).optional(),
  appointmentTime: z.union([z.enum(["morning", "afternoon", "evening"]), timeHHMM]).optional(),
  durationHours: z.coerce.number().int().min(1).max(8).optional(),
  notes: z.string().max(1000).optional(),
  consultantId: z.string().refine((v) => mongoose.isValidObjectId(v), "Invalid consultantId").optional(),
  consultantName: z.string().trim().max(120).optional(),
});

/* ---------------------------------------------
 * Allowed fields / normalize helpers
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
  // "status"  // blocked for non-admin in generic update
  "consultantId",
  "consultantName",
];

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  return out;
}

function normalize(input) {
  const data = { ...input };

  for (const k of ["name", "phone", "email", "state", "city", "address", "category", "notes", "consultantName"]) {
    if (typeof data[k] === "string") data[k] = data[k].trim();
  }

  // Date (accept Date or ISO string)
  if (data.appointmentDate) {
    const d = new Date(data.appointmentDate);
    if (!Number.isNaN(d.getTime())) data.appointmentDate = d;
  }

  // Time: map period -> HH:mm
  if (data.appointmentTime != null) {
    const t = String(data.appointmentTime).toLowerCase();
    if (PERIODS.has(t)) data.appointmentTime = PERIOD_TO_TIME[t];
  }

  // Duration guard
  if (data.durationHours != null) {
    const n = Number(data.durationHours);
    data.durationHours = Number.isFinite(n) && n > 0 ? Math.min(8, Math.max(1, Math.floor(n))) : 1;
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

    // Zod validation (rich field-level reasons)
    const parsed = appointmentCreateSchema.safeParse(raw);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({ name: i.path.join("."), reason: i.message }));
      return res.status(422).json({ message: "Validation failed", invalidParams: details });
    }

    const data = normalize(parsed.data);
    if (me) data.userId = me; // set owner if logged in; otherwise allow anonymous
    data.status = "pending"; // enforce new bookings start as pending

    const doc = await AppointmentModel.create(data);

    // Optional email: notify consultant about new request
    try {
      const consultant = await User.findById(data.consultantId).lean();
      if (consultant?.email) {
        const dateStr = fmtEmailDate(doc.appointmentDate);
        let farmerFirst = null;
        if (me) {
          const farmer = await User.findById(me).lean();
          farmerFirst = farmer?.firstName;
        }
        await sendMail(
          EmailTpl.created(
            farmerFirst || data.name || "User",
            dateStr,
            consultant.email,
            doc._id
          )
        );
      }
    } catch (e) {
      console.error("[appointments:create] mail error:", e?.message || e);
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
export async function listMyAppointments(req, res) {
  try {
    const me = authUserId(req);
    if (!me) return res.status(401).json({ message: "Not authenticated" });

    const { status, q: text } = req.query || {};
    const q = { userId: me };
    if (status) q.status = status;

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
    console.error("❌ listMyAppointments:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listMyConsultantAppointments(req, res) {
  try {
    const me = authUserId(req);
    if (!me) return res.status(401).json({ message: "Not authenticated" });

    const { status, q: text } = req.query || {};
    const q = { consultantId: me };
    if (status) q.status = status;

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

    const appointment = await AppointmentModel.findOne(criteria).lean();
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

  // Validate input first
  const parsed = appointmentUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({ name: i.path.join("."), reason: i.message }));
    return res.status(422).json({ message: "Validation failed", invalidParams: details });
  }
  const update = normalize(parsed.data);

  try {
    const criteria = buildReadCriteria(req, { _id: id });
    if (!criteria) return res.status(401).json({ message: "Not authenticated" });

    // Don’t allow non-admins to change protected fields
    if (!isAdmin(req)) {
      delete update.status;
      delete update.declineReason;
      delete update.events;
      delete update.userId;
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
export async function confirmAppointment(req, res) {
  try {
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

    ensureEvents(appt);
    appt.status = "confirmed";
    appt.events.push({ action: "confirmed", byUser: me });
    await appt.save();

    // email + notify farmer
    let emailSent = false;
    try {
      const farmer = await User.findById(appt.userId).lean();
      const consultant = await User.findById(appt.consultantId).lean();
      const targetEmail = (appt.email || "").trim() || farmer?.email; // prefer email from booking form
      if (targetEmail) {
        await sendMail(
          EmailTpl.confirmed(
            `${consultant?.firstName || "Consultant"}`,
            fmtEmailDate(appt.appointmentDate),
            targetEmail,
            appt._id
          )
        );
        emailSent = true;
      }
      await notify(
        appt.userId,
        "Appointment confirmed",
        `Your appointment on ${fmtEmailDate(appt.appointmentDate)} was confirmed.`,
        appt._id
      );
    } catch (e) {
      console.error("[appointments:confirm] notify/mail error:", e?.message || e);
    }

    return res.json({ ok: true, status: appt.status, emailSent });
  } catch (e) {
    console.error("❌ confirmAppointment:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function declineAppointment(req, res) {
  try {
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

    ensureEvents(appt);
    appt.status = "declined";
    appt.declineReason = (reason || "").trim();
    appt.events.push({ action: "declined", byUser: me, note: appt.declineReason });
    await appt.save();

    let emailSent = false;
    try {
      const farmer = await User.findById(appt.userId).lean();
      const consultant = await User.findById(appt.consultantId).lean();
      const targetEmail = (appt.email || "").trim() || farmer?.email; // prefer email from booking form
      if (targetEmail) {
        await sendMail(
          EmailTpl.declined(
            `${consultant?.firstName || "Consultant"}`,
            fmtEmailDate(appt.appointmentDate),
            targetEmail,
            appt.declineReason,
            appt._id
          )
        );
        emailSent = true;
      }
      await notify(
        appt.userId,
        "Appointment declined",
        `Your request for ${fmtEmailDate(appt.appointmentDate)} was declined.`,
        appt._id
      );
    } catch (e) {
      console.error("[appointments:decline] notify/mail error:", e?.message || e);
    }

    return res.json({ ok: true, status: appt.status, emailSent });
  } catch (e) {
    console.error("❌ declineAppointment:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function cancelAppointment(req, res) {
  try {
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

    ensureEvents(appt);
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
    } catch (e) {
      console.error("[appointments:cancel] notify/mail error:", e?.message || e);
    }

    return res.json({ ok: true, status: appt.status });
  } catch (e) {
    console.error("❌ cancelAppointment:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function completeAppointment(req, res) {
  try {
    const { id } = req.params;
    const me = authUserId(req);
    if (!me) return res.status(401).json({ message: "Not authenticated" });
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });

    const appt = await AppointmentModel.findById(id);
    if (!appt) return res.status(404).json({ message: "Not found" });

    const isOwner =
      String(appt.userId) === String(me) ||
      String(appt.consultantId) === String(me) ||
      isAdmin(req);
    if (!isOwner) return res.status(403).json({ message: "Not permitted" });

    if (!["confirmed"].includes(appt.status))
      return res.status(400).json({ message: "Only confirmed can be completed" });

    ensureEvents(appt);
    appt.status = "completed";
    appt.events.push({ action: "completed", byUser: me });
    await appt.save();

    try {
      await notify(appt.userId, "Appointment completed", "Your appointment was marked as completed.", appt._id);
      await notify(appt.consultantId, "Appointment completed", "Appointment marked as completed.", appt._id);
    } catch (e) {
      console.error("[appointments:complete] notify error:", e?.message || e);
    }

    return res.json({ ok: true, status: appt.status });
  } catch (e) {
    console.error("❌ completeAppointment:", e);
    return res.status(500).json({ message: "Server error" });
  }
}
