// backend/models/AppointmentModel.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/** Counter to auto-increment `appointmentId` (simple number) */
const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1000 }, // start at 1000 (change if you want)
});
const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const AppointmentSchema = new Schema(
  {
    // simple numeric id for humans (auto-generated)
    appointmentId: { type: Number, unique: true, index: true },

    // who submitted
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v) => /^\+?[0-9()\-\s]{7,20}$/.test(v),
        message: "Invalid phone number format",
      },
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },

    // location + category
    state: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    address: { type: String },
    category: {
      type: String,
      required: true,
      index: true,
      enum: ["SoilTest", "Irrigation", "PestControl", "Fertilizer", "Consultation", "Other"],
    },

    // timing
    appointmentDate: {
      type: String,
      required: true,
      index: true,
      validate: {
        validator: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v), // YYYY-MM-DD
        message: "appointmentDate must be YYYY-MM-DD",
      },
    },
    
    appointmentTime: {
      type: String,
      required: true,
      validate: {
        validator: (v) =>
          /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ||
          ["morning", "afternoon", "evening"].includes(v),
        message: "appointmentTime must be HH:mm or one of morning/afternoon/evening",
      },
    },

    durationHours: { type: Number, min: 1, max: 240, required: true },

    // misc
    notes: { type: String, maxlength: 1000 },
    
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending",
      index: true,
    },

  },
  { timestamps: true }
);

/** Auto-assign appointmentId when creating */
AppointmentSchema.pre("save", async function (next) {
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

const AppointmentModel =
  mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);

export default AppointmentModel;
