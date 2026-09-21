import { Router } from 'express';
import { isAuthenticated } from '../lib/auth.js';
import {
  cancelAppointment,
  createAppointment,
  getAppointmentById,
  getAppointments,
} from '../services/appointments.js';

const router = Router();

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const appointments = await getAppointments(req.user.id, req.user.role);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post('/create', isAuthenticated, async (req, res) => {
  try {
    const appointmentData = {
      ...req.body,
      patient_id: req.user.id,
    };

    const appointment = await createAppointment(appointmentData);
    res.status(200).json(appointment);
  } catch (error) {
    res.status(422).json({ detail: error.message });
  }
});

router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const appointment = await getAppointmentById(req.params.id);
    if (!appointment)
      return res.status(404).json({ detail: 'Appointment not found' });

    if (
      appointment.patient_id !== req.user.id &&
      appointment.therapist_id !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ detail: 'Forbidden' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(400).json({ detail: error.message });
  }
});

router.put('/:id/cancel', isAuthenticated, async (req, res) => {
  try {
    await cancelAppointment(req.params.id, req.user.id);
    res.json({});
  } catch (error) {
    res.status(422).json({ detail: error.message });
  }
});

export default router;
