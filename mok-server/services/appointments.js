import crypto from 'node:crypto';
import * as db from '../services/db.js';

export async function getAppointments(userId, role) {
  return db.appointments.filter(
    (a) => a.patient_id === userId || a.therapist_id === userId,
  );
}

export async function getAppointmentById(id) {
  return db.appointments.find((a) => a.id === id);
}

export async function createAppointment(data) {
  const {
    patient_id,
    psychologist_id,
    type,
    scheduled_time,
    reason,
    remind_time,
    venue: inputVenue,
    comment,
  } = data;

  const now = new Date();
  const scheduledTimeDate = new Date(scheduled_time);

  if (scheduledTimeDate <= now) {
    throw new Error(`Недопустимое время записи: ${scheduled_time}`);
  }

  if (remind_time) {
    const remindTimeDate = new Date(remind_time);
    if (remindTimeDate <= now)
      throw new Error('Время напоминания не может быть в прошлом');
    if (remindTimeDate >= scheduledTimeDate)
      throw new Error('Время напоминания должно быть раньше времени встречи');
  }

  const patient = db.users.find((u) => u.id === patient_id);
  if (!patient) throw new Error(`Patient not found: ${patient_id}`);

  const psychologist = db.therapists.find((t) => t.id === psychologist_id);
  if (!psychologist)
    throw new Error(`Psychologist not found: ${psychologist_id}`);

  let finalVenue = inputVenue;
  if (type === 'Offline') {
    finalVenue = psychologist.office;
  } else if (type === 'Online') {
    if (!inputVenue)
      throw new Error('Для онлайн встречи требуется указать место (venue)');
  }

  const newAppointment = {
    id: crypto.randomUUID(),
    patient_id,
    therapist_id: psychologist_id,
    type,
    reason,
    status: 'Accepted',
    scheduled_time,
    remind_time,
    venue: finalVenue,
    comment,
    last_change_time: now.toISOString(),
  };

  db.appointments.push(newAppointment);
  return newAppointment;
}

export async function cancelAppointment(id, userId) {
  const appointment = db.appointments.find((a) => a.id === id);
  if (!appointment) throw new Error('Запись не найдена');

  if (
    appointment.patient_id !== userId &&
    appointment.therapist_id !== userId
  ) {
    throw new Error('Нет прав на отмену этой записи');
  }

  appointment.status = 'Cancelled';
  appointment.last_change_time = new Date().toISOString();
  return appointment;
}
