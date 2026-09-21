import type { Appointment } from '@/entities/appointment/types';
import type { User } from '@/entities/auth';
import type { Psychologist } from '@/entities/psychologist/types';

export interface Application {
  id: string;
  user: User | null;
  assigned_to_user: User | null;
  psychologist: Psychologist | null;
  appointment: Appointment | null;
  problem_description: string;
  preferred_campus: string | null;
  university_status: UniversityStatus;
  status: ApplicationStatus;
  meeting_type: MeetingType | null;
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
  cancel_initiator: CancelInitiator | null;
  internal_comment: string | null;
  version: number;
}

export type ApplicationStatus =
  | 'new'
  | 'in_progress'
  | 'awaiting_user_confirmation'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export type UniversityStatus = string;
// export type UniversityStatus = 'студент' | 'аспирант' | 'преподаватель' | 'сотрудник';
export type MeetingType = 'offline' | 'online';
export type CancelInitiator = 'user' | 'psychologist' | 'manager' | 'system';

export interface ApplicationCreateRequest {
  psychologist_id: string;
  scheduled_at: string;
  problem_description: string;
  preferred_campus?: string;
  university_status: UniversityStatus;
}

export interface CancelRequest {
  cancel_reason: string;
  cancel_initiator: CancelInitiator;
}
