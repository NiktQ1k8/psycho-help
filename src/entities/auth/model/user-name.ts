import type { TUserContact } from '@/entities/auth/types';

export const getUserFullName = (
  user: Pick<TUserContact, 'last_name' | 'first_name' | 'middle_name'>,
) =>
  [user.last_name, user.first_name, user.middle_name]
    .filter(Boolean)
    .join(' ') || 'Имя не указано';
