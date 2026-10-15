import { AxiosError, AxiosHeaders } from 'axios';
import { expect, it } from 'vitest';
import { getErrorMessage } from './errors';

it.each([
  ['Неверный пароль', 'Неверный пароль'],
  [[{ msg: 'Field is required' }], 'Field is required'],
  [
    { errors: { duration: 'Duration must be either 60 or 90 minutes' } },
    'Duration must be either 60 or 90 minutes',
  ],
])('показывает сообщение из ответа бэкенда: %j', (detail, message) => {
  const error = new AxiosError(
    'Request failed',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { detail },
    },
  );
  expect(getErrorMessage(error)).toBe(message);
  expect(error.response?.status).toBe(422);
});
