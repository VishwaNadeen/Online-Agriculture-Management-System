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
    at: { type: Date, default: Date.now },
    byUser: { type: Schema.Types.ObjectId, ref: "User" },
    action: {
      type: String,
      enum: ["created", "confirmed", "declined", "cancelled", "completed", "reschedule_proposed"],
      required: true,
    },
    note: { type: String, trim: true },
  },
  { _id: false }
);

/* ---------------------------------------------
 * Appointment
 * --------------------------------------------- */
const AppointmentSchema = new Schema(
  {
    appointmentId: { type: Number, unique: true, index: true },

    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    consultantId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    consultantName: { type: String, trim: true },

    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    category: { type: String, required: true, trim: true },

    appointmentDate: { type: Date, required: true, index: true },

    appointmentTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, "appointmentTime must be HH:mm"],
    },
    timeMode: { type: String, enum: ["period", "exact"], default: "period" },
    durationHours: { type: Number, min: 1, default: 1 },

    notes: { type: String, maxlength: 1000 },

    status: {
      type: String,
      enum: ["pending", "confirmed", "declined", "cancelled", "completed"],
      default: "pending",
      index: true,
    },

    declineReason: { type: String, trim: true, default: "" },

    events: { type: [EventSchema], default: [] },
  },
  { timestamps: true }
);

/* ---------------------------------------------
 * Indexes
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
