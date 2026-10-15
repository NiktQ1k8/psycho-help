import type { TUserContact } from '@/entities/auth/types';

export type TPsychologist = {
  id: string;
  user_id: string;
  experience: string;
  qualification: string;
  consult_areas: string;
  description: string;
  office: string;
  education: string;
  short_description: string;
  photo: string | null;
  user: TUserContact | null;
};
