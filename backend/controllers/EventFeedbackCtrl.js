// EventFeedbackCtrl.js
import EventFeedback from '../models/EventFeedbackModel.js';

// Create Feedback
const createFeedback = async (req, res) => {
  try {
    const { farmerId, eventId } = req.body;
    // Optional: Ensure the authenticated user matches the provided farmerId unless admin
    const role = req.user?.role;
    const uid = req.user?.sub;
    if (role !== 'admin' && uid && farmerId && uid !== farmerId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Check if user has already submitted feedback for this event
    const existingFeedback = await EventFeedback.findOne({ farmerId, eventId });
    if (existingFeedback) {
      return res.status(409).json({ 
        error: 'You have already submitted feedback for this event',
        message: 'Only one feedback per event is allowed'
      });
    }
    
    const feedback = new EventFeedback(req.body);
    await feedback.save();
    
    // Populate the event data in response
    await feedback.populate('eventId');
    
    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All Feedbacks
const getFeedbacks = async (req, res) => {
  try {
    const { farmerId, eventId } = req.query;
    let query = {};
    
    if (farmerId) query.farmerId = farmerId;
    if (eventId) query.eventId = eventId;
    
    const feedbacks = await EventFeedback.find(query).populate('eventId');
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Feedback by ID
const getFeedbackById = async (req, res) => {
  try {
    const feedback = await EventFeedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Feedback
const updateFeedback = async (req, res) => {
  try {
    const feedback = await EventFeedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    const role = req.user?.role;
    const uid = req.user?.sub;
    if (role !== 'admin' && uid !== feedback.farmerId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Restrict updatable fields
    const updates = {};
    if (typeof req.body.rating !== 'undefined') updates.rating = req.body.rating;
    if (typeof req.body.comments !== 'undefined') updates.comments = req.body.comments;
    const updated = await EventFeedback.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Feedback
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await EventFeedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    const role = req.user?.role;
    const uid = req.user?.sub;
    if (role !== 'admin' && uid !== feedback.farmerId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await EventFeedback.findByIdAndDelete(req.params.id);
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default {
  createFeedback,
  getFeedbacks,
  getFeedbackById,
  updateFeedback,
  deleteFeedback
};
