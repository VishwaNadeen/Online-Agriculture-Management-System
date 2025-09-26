// EventRegistrationCtrl.js
import EventRegistration from '../models/EventRegistrationModel.js';

// Create Registration
const createRegistration = async (req, res) => {
  try {
    const registration = new EventRegistration(req.body);
    await registration.save();
    res.status(201).json(registration);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All Registrations
const getRegistrations = async (req, res) => {
  try {
    const registrations = await EventRegistration.find();
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Registration by ID
const getRegistrationById = async (req, res) => {
  try {
    const registration = await EventRegistration.findById(req.params.id);
    if (!registration) return res.status(404).json({ error: 'Registration not found' });
    res.json(registration);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Registration
const updateRegistration = async (req, res) => {
  try {
    const registration = await EventRegistration.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!registration) return res.status(404).json({ error: 'Registration not found' });
    res.json(registration);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Registration
const deleteRegistration = async (req, res) => {
  try {
    const registration = await EventRegistration.findByIdAndDelete(req.params.id);
    if (!registration) return res.status(404).json({ error: 'Registration not found' });
    res.json({ message: 'Registration deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  updateRegistration,
  deleteRegistration
};
