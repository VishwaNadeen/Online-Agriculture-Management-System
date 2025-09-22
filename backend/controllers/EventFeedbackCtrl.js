// EventFeedbackCtrl.js
import EventFeedback from '../models/EventFeedbackModel.js';

// Create Feedback
const createFeedback = async (req, res) => {
  try {
    const feedback = new EventFeedback(req.body);
    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All Feedbacks
const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await EventFeedback.find();
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
    const feedback = await EventFeedback.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Feedback
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await EventFeedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
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
