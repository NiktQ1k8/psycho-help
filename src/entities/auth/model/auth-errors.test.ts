import { AxiosError, AxiosHeaders } from 'axios';
import { expect, it } from 'vitest';
import { getAuthErrorMessage } from './auth-errors';

const responseError = (status: number, detail?: unknown) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: String(status),
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { detail },
  });

it.each([
  [
    [
      {
        type: 'value_error',
        loc: ['body', 'email'],
        msg: 'value is not a valid email address',
      },
    ],
    'Введите корректный адрес электронной почты',
  ],
  [
    [
      {
        type: 'string_too_long',
        loc: ['body', 'password'],
        ctx: { max_length: 64 },
      },
    ],
    'Пароль: не более 64 символов',
  ],
  [
    [
      {
        type: 'value_error',
        loc: ['body'],
        msg: 'Value error, Новый пароль должен отличаться от текущего',
      },
    ],
    'Новый пароль должен отличаться от текущего',
  ],
])('переводит ошибки валидации бэкенда на понятный язык', (detail, message) => {
  expect(getAuthErrorMessage(responseError(422, detail), 'registration')).toBe(
    message,
  );
});

it('объясняет ограничение попыток вместо технического ответа SlowAPI', () => {
  expect(getAuthErrorMessage(responseError(429), 'login')).toBe(
    'Слишком много попыток. Подождите немного и попробуйте снова',
  );
});

it('при сбое сервера показывает понятное сообщение без технических деталей', () => {
  expect(
    getAuthErrorMessage(
      responseError(500, 'Internal Server Error'),
      'registration',
    ),
  ).toBe('Не удалось зарегистрироваться. Ошибка сервера — попробуйте позже');
});
