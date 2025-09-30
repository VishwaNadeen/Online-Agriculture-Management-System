// backend/models/Notification.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    title:  { type: String, required: true },
    message:{ type: String, required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
