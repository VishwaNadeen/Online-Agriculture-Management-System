// models/AppointmentModel.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/* ---- Counter (auto-increment) ---- */
const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1000 }, // start value
});
const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

/* ---- Appointment ---- */
const AppointmentSchema = new Schema({
  appointmentId: { type: Number, unique: true, index: true }, // <- optional nice ID

  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  category: { type: String, required: true, trim: true },

  appointmentDate: { type: Date, required: true },
  appointmentTime: {
    type: String,
    required: true,
    match: [/^\d{2}:\d{2}$/, "appointmentTime must be HH:mm"],
  },
  durationHours: { type: Number, min: 1, default: 1 },
  notes: { type: String, maxlength: 1000 },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending",
    index: true,
  },
}, { timestamps: true });

/* ---- assign appointmentId automatically ---- */
AppointmentSchema.pre("save", async function(next) {
  if (!this.isNew || this.appointmentId) return next();
  try {
    const counter = await Counter.findByIdAndUpdate(
      "appointmentId",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.appointmentId = counter.seq;
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.models.Appointment
  || mongoose.model("Appointment", AppointmentSchema);
