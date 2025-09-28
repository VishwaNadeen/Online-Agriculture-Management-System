// EventRegistrationRoute.js
import express from 'express';
import EventRegistrationCtrl from '../controllers/EventRegistrationCtrl.js';
const router = express.Router();

// CRUD routes for Event Registration
router.post('/', EventRegistrationCtrl.createRegistration);
router.get('/', EventRegistrationCtrl.getRegistrations);
router.get('/:id', EventRegistrationCtrl.getRegistrationById);
router.put('/:id', EventRegistrationCtrl.updateRegistration);
router.delete('/:id', EventRegistrationCtrl.deleteRegistration);

export default router;