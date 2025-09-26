// EventRoute.js
import express from 'express';
import EventCtrl from '../controllers/EventCtrl.js';
const router = express.Router();

// CRUD routes for Event
router.post('/', EventCtrl.createEvent);
router.get('/', EventCtrl.getEvents);
router.get('/:id', EventCtrl.getEventById);
router.put('/:id', EventCtrl.updateEvent);
router.delete('/:id', EventCtrl.deleteEvent);

export default router;
