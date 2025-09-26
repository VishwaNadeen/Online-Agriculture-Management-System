// EventModel.js
import { Schema, model } from 'mongoose';

const EventSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    trainerName: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    duration: { type: String }, // optional
    location: { type: String, required: true },
    category: { type: String, enum: ['Workshop', 'Webinar', 'Field Visit'], required: true },
    capacity: { type: Number, required: true },
    registrationDeadline: { type: Date, required: true },
    createdBy: { type: String, required: true }, // admin name/ID
}, { timestamps: true });

export default model('Event', EventSchema);
