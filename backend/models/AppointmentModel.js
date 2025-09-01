import mongoose from "mongoose";

const Schema = mongoose.Schema;

const appointmentSchema = new Schema(
  {
    state: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    address: { type: String },

    appointmentDate: {
      type: String,
      required: true,
      index: true,
      validate: {
        validator: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
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
        message:
          "appointmentTime must be HH:mm or one of morning/afternoon/evening",
      },
    },

    durationHours: { type: Number, min: 1, max: 240, required: true },

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

const AppointmentModel = mongoose.model("Appointment", appointmentSchema);

export default AppointmentModel;
