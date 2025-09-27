// backend/models/AppointmentModel.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/* ---------------------------------------------
 * Counter (auto-increment for pretty IDs)
 * --------------------------------------------- */
const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1000 }, // start value
});
const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

/* ---------------------------------------------
 * Embedded event timeline for status history
 * --------------------------------------------- */
const EventSchema = new Schema(
  {
    at: { type: Date, default: Date.now }, // when it happened
    byUser: { type: Schema.Types.ObjectId, ref: "User" }, // who did it
    action: {
      type: String,
      enum: ["created", "confirmed", "declined", "cancelled", "completed", "reschedule_proposed"],
      required: true,
    },
    note: { type: String, trim: true }, // e.g., decline reason, reschedule note
  },
  { _id: false }
);

/* ---------------------------------------------
 * Appointment
 * --------------------------------------------- */
const AppointmentSchema = new Schema(
  {
    // Pretty display ID (auto-incremented)
    appointmentId: { type: Number, unique: true, index: true },

    // Who booked (farmer / normal user)
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Who will consult — using User model (consultant role)
    // If your project keeps a separate "Consultant" collection, you can switch ref back,
    // but since consultants log in as users, this keeps ownership & permissions simple.
    consultantId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    consultantName: { type: String, trim: true }, // optional denormalized display name

    // Contact + meta
    name: { type: String, required: true, trim: true },  // booking user's name
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    category: { type: String, required: true, trim: true },

    // Time (store as Date in UTC; render in local on FE)
    appointmentDate: { type: Date, required: true, index: true },

    // Additional time details you already had
    appointmentTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, "appointmentTime must be HH:mm"],
    },
    timeMode: { type: String, enum: ["period", "exact"], default: "period" },
    durationHours: { type: Number, min: 1, default: 1 },

    // Notes from user
    notes: { type: String, maxlength: 1000 },

    // Status lifecycle
    status: {
      type: String,
      enum: ["pending", "confirmed", "declined", "cancelled", "completed"],
      default: "pending",
      index: true,
    },

    // If declined, keep a reason (optional)
    declineReason: { type: String, trim: true, default: "" },

    // Event history (audit trail)
    events: { type: [EventSchema], default: [] },
  },
  { timestamps: true }
);

/* ---------------------------------------------
 * Indexes to speed up common dashboard queries
 * --------------------------------------------- */
AppointmentSchema.index({ consultantId: 1, appointmentDate: -1 });
AppointmentSchema.index({ userId: 1, appointmentDate: -1 });
AppointmentSchema.index({ status: 1, appointmentDate: -1 });

/* ---------------------------------------------
 * Auto-assign appointmentId
 * --------------------------------------------- */
AppointmentSchema.pre("save", async function (next) {
  if (!this.isNew || this.appointmentId) return next();
  try {
    const counter = await Counter.findByIdAndUpdate(
      "appointmentId",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.appointmentId = counter.seq;

    // also push a "created" event on first save (optional but useful)
    this.events.push({
      action: "created",
      byUser: this.userId,
      note: this.notes || "",
    });

    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.models.Appointment ||
  mongoose.model("Appointment", AppointmentSchema);
