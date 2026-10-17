import type { TUserContact } from '@/entities/auth/types';
import type { TPsychologist } from '@/entities/psychologist/types';

export type TAppointment = {
  id: string;
  patient: TUserContact;
  psychologist: TPsychologist & { user: TUserContact };
  application_id: string | null;
  type: TAppointmentType;
  reason: string | null;
  status: TAppointmentStatus;
  scheduled_time: string;
  remind_time: string | null;
  last_change_time: string;
  venue: string;
  comment: string | null;
  cancel_reason: string | null;
  patient_comment: string | null;
  conclusion: string | null;
  emergency_contact: string | null;
};

export type TAppointmentStatus = 'awaiting' | 'cancelled' | 'done';
export type TAppointmentType = 'Offline' | 'Online';

export type TAppointmentCreateRequest = {
  application_id?: string | null;
  patient_id: string;
  psychologist_id: string;
  type: TAppointmentType;
  scheduled_time: string;
  reason?: string | null;
  remind_time?: string | null;
  venue?: string | null;
  comment?: string | null;
};

export type TAppointmentReschedule = {
  id: string;
  appointment_id: string;
  requested_by_user_id: string | null;
  status: 'pending' | 'confirmed' | 'rejected';
  old_scheduled_time: string;
  old_remind_time: string | null;
  old_venue: string;
  old_comment: string | null;
  requested_scheduled_time: string;
  requested_remind_time: string | null;
  requested_venue: string | null;
  requested_comment: string | null;
  rejection_comment: string | null;
  created_at: string;
  responded_at: string | null;
};
