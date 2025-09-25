// EventRegistrationModel.js
import mongoose from 'mongoose';

const EventRegistrationSchema = new mongoose.Schema({
  farmerId: { type: String, required: true }, // Farmer/User ID
  farmerName: { type: String, required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  contactInfo: { type: String, required: true }, // Phone or Email
  specialNotes: { type: String }, // Optional
}, { timestamps: true });

export default mongoose.model('EventRegistration', EventRegistrationSchema);
