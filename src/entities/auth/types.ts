import type { TRole } from '@/entities/role/types';

export type TUser = {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone_number: string;
  email: string;
  social_media: string | null;
  study_group: string | null;
  roles: TRole[];
};

// Вложенный пользователь в заявках и записях приходит без ролей.
export type TUserContact = Omit<TUser, 'roles'>;

export type TRegistrationData = {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  phone_number: string;
  email: string;
  social_media?: string | null;
  password: string;
  study_group?: string | null;
};

export type TLoginData = {
  email: string;
  password: string;
};

export type TUserPasswordUpdate = {
  old_password: string;
  new_password: string;
};

export type TAuthMessageResponse = {
  message: string;
};

export type TPasswordResetRequest = { email: string };
export type TPasswordResetConfirmRequest = {
  token: string;
  new_password: string;
};

export type TUserProfileUpdate = {
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  phone_number?: string;
  email?: string;
  social_media?: string | null;
  study_group?: string | null;
};
