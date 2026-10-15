import type { TAppointment } from '@/entities/appointment/types';
import type { TUserContact } from '@/entities/auth/types';
import type { TPsychologist } from '@/entities/psychologist/types';

export type TApplication = {
  id: string;
  user: TUserContact | null;
  assigned_to_user: TUserContact | null;
  psychologist: TPsychologist | null;
  appointment: TApplicationAppointment | null;
  problem_description: string;
  preferred_campus: string | null;
  university_status: TUniversityStatus;
  status: TApplicationStatus;
  meeting_type: TMeetingType | null;
  scheduled_at: string | null;
  location_address: string | null;
  meeting_url: string | null;
  created_at: string;
  updated_at: string;
  processing_started_at: string | null;
  confirmation_requested_at: string | null;
  completed_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  expired_at: string | null;
  reject_reason: string | null;
  cancel_reason: string | null;
  cancel_initiator: TCancelInitiator | null;
  internal_comment: string | null;
  version: number;
};

export type TApplicationStatus =
  | 'new'
  | 'in_progress'
  | 'awaiting_user_confirmation'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export type TUniversityStatus =
  'студент' | 'аспирант' | 'преподаватель' | 'сотрудник';
export type TMeetingType = 'offline' | 'online';
export type TCancelInitiator = 'user' | 'psychologist' | 'manager' | 'system';

export type TApplicationCreateRequest = {
  psychologist_id: string;
  scheduled_at: string;
  problem_description: string;
  preferred_campus?: string | null;
  university_status: TUniversityStatus;
};

export type TCancelRequest = {
  cancel_reason: string;
  cancel_initiator: TCancelInitiator;
};

export type TApplicationListParams = {
  skip?: number;
  limit?: number;
  status?: TApplicationStatus | null;
  assigned_to?: string | null;
  sort_by?: string;
  sort_desc?: boolean;
};

export type TOfferConsultationRequest = {
  psychologist_id: string;
  meeting_type: TMeetingType;
  scheduled_at: string;
  location_address?: string | null;
  meeting_url?: string | null;
};

export type TApplicationAppointment = Omit<
  TAppointment,
  'psychologist' | 'emergency_contact' | 'type' | 'status'
> & {
  psychologist_id: string;
  type: string;
  status: string;
};
