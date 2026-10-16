import { isValidPhoneNumber } from 'libphonenumber-js/max';
import type { TUser } from '@/entities/auth/types';

export const PHONE_MAX_LENGTH = 16; // «+» и до 15 цифр в международном номере.

export type TProfileFormData = {
  first_name: string;
  last_name: string;
  middle_name: string;
  phone_number: string;
  email: string;
  social_media: string;
  study_group: string;
};

export type TProfileFormErrors = Partial<
  Record<keyof TProfileFormData, string>
>;

export const getProfileFormData = (user: TUser | null): TProfileFormData => ({
  first_name: user?.first_name ?? '',
  last_name: user?.last_name ?? '',
  middle_name: user?.middle_name ?? '',
  phone_number: user?.phone_number ?? '',
  email: user?.email ?? '',
  social_media: user?.social_media ?? '',
  study_group: user?.study_group ?? '',
});

export const normalizePhoneInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return value.trimStart().startsWith('+') ? '+' : '';
  const normalizedDigits = value.trimStart().startsWith('+')
    ? digits
    : digits.startsWith('8')
      ? `7${digits.slice(1)}`
      : digits.startsWith('7')
        ? digits
        : `7${digits}`;
  return `+${normalizedDigits}`.slice(0, PHONE_MAX_LENGTH);
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) return 'Введите пароль';
  if (password.length < 8 || password.length > 64)
    return 'Пароль должен содержать от 8 до 64 символов';
  if (password !== password.trim())
    return 'Пароль не должен начинаться или заканчиваться пробелами';
};

export const validateProfileField = (
  name: keyof TProfileFormData,
  input: string,
): string | undefined => {
  const value = input.trim();
  if (
    !value &&
    ['first_name', 'last_name', 'phone_number', 'email'].includes(name)
  ) {
    return 'Обязательное поле';
  }
  if (!value) return undefined;

  if (name !== 'phone_number' && value.length > (name === 'email' ? 64 : 50)) {
    return `Максимум ${name === 'email' ? 64 : 50} символов`;
  }

  switch (name) {
    case 'first_name':
    case 'last_name':
    case 'middle_name':
      if (
        !/^\p{L}[\p{L}\p{M}]*(?:[ '\u2019-]\p{L}[\p{L}\p{M}]*)*$/u.test(value)
      ) {
        return 'Допустимы буквы, пробел, дефис и апостроф между частями имени';
      }
      break;
    case 'email':
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
        value
          .split('@')
          .some(
            (part) =>
              part.startsWith('.') || part.endsWith('.') || part.includes('..'),
          )
      ) {
        return 'Некорректный email';
      }
      break;
    case 'phone_number':
      if (
        value.length < 10 ||
        value.length > PHONE_MAX_LENGTH ||
        !/^\+\d+$/.test(value) ||
        !isValidPhoneNumber(value)
      ) {
        return 'Введите полный номер с кодом страны, например +79991234567';
      }
      break;
  }
  return undefined;
};
