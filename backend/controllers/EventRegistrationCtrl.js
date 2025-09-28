// EventRegistrationCtrl.js
import EventRegistration from '../models/EventRegistrationModel.js';

// Create Registration
const createRegistration = async (req, res) => {
  try {
    const { farmerId, eventId } = req.body;
    
    // Check if user is already registered for this event
    const existingRegistration = await EventRegistration.findOne({ farmerId, eventId });
    if (existingRegistration) {
      return res.status(409).json({ 
        error: 'You are already registered for this event',
        message: 'Duplicate registration not allowed'
      });
    }
    
    const registration = new EventRegistration(req.body);
    await registration.save();
    
    // Populate the event data in response
    await registration.populate('eventId');
    
    res.status(201).json(registration);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All Registrations
const getRegistrations = async (req, res) => {
  try {
    const { farmerId, eventId } = req.query;
    let query = {};
    
    if (farmerId) query.farmerId = farmerId;
    if (eventId) query.eventId = eventId;
    
    console.log('Fetching registrations with query:', query);
    const registrations = await EventRegistration.find(query).populate('eventId');
    console.log('Found registrations:', registrations.length);
    res.json(registrations);
  } catch (err) {
    console.error('Error in getRegistrations:', err);
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
