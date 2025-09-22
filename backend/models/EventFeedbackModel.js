// EventFeedbackModel.js
import mongoose from 'mongoose';

const EventFeedbackSchema = new mongoose.Schema({
  farmerId: { type: String, required: true }, // Farmer/User ID
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comments: { type: String },
}, { timestamps: true });

export default mongoose.model('EventFeedback', EventFeedbackSchema);
