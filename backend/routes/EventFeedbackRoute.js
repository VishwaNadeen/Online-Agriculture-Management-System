// EventFeedbackRoute.js
import express from 'express';
import EventFeedbackCtrl from '../controllers/EventFeedbackCtrl.js';
const router = express.Router();

// CRUD routes for Event Feedback
router.post('/', EventFeedbackCtrl.createFeedback);
router.get('/', EventFeedbackCtrl.getFeedbacks);
router.get('/:id', EventFeedbackCtrl.getFeedbackById);
router.put('/:id', EventFeedbackCtrl.updateFeedback);
router.delete('/:id', EventFeedbackCtrl.deleteFeedback);

export default router;
