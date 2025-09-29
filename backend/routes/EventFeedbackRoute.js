// EventFeedbackRoute.js
import express from 'express';
import EventFeedbackCtrl from '../controllers/EventFeedbackCtrl.js';
import { requireAuth } from '../middlewares/auth.js';
const router = express.Router();

// CRUD routes for Event Feedback
router.post('/', requireAuth, EventFeedbackCtrl.createFeedback);
router.get('/', EventFeedbackCtrl.getFeedbacks);
router.get('/:id', EventFeedbackCtrl.getFeedbackById);
router.put('/:id', requireAuth, EventFeedbackCtrl.updateFeedback);
router.delete('/:id', requireAuth, EventFeedbackCtrl.deleteFeedback);

export default router;
