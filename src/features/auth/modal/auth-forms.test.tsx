import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, expect, it, vi } from 'vitest';
import { authApi } from '@/entities/auth/api';
import { useAuth } from '@/entities/auth/model/useAuth';
import type { TUser } from '@/entities/auth/types';
import ModalLogin from './modal-login';
import ModalRegistration from './modal-registration';

vi.mock('@/entities/auth/api', () => ({
  authApi: { login: vi.fn(), registration: vi.fn() },
}));
const user: TUser = {
  id: 'test-user',
  first_name: 'Анна-Мария',
  last_name: 'О’Коннор',
  middle_name: null,
  email: 'student+demo@sub.example.com',
  phone_number: '+442079460018',
  social_media: null,
  study_group: null,
  roles: [{ code: 'user', name: 'Пользователь', description: null }],
};
const password = 'password123';
beforeEach(() => {
  vi.resetAllMocks();
  useAuth.getState().resetSession();
});

it('входит по Enter с обычным email, содержащим плюс и поддомен', async () => {
  vi.mocked(authApi.login).mockResolvedValue(user);
  const close = vi.fn();
  render(<ModalLogin isOpen setWindow={vi.fn()} setModalOpen={close} />);
  await userEvent.type(screen.getByLabelText('Электронная почта'), user.email);
  await userEvent.type(
    screen.getByPlaceholderText('Введите пароль'),
    password + '{Enter}',
  );
  await waitFor(() => expect(close).toHaveBeenCalledWith(false));
  expect(authApi.login).toHaveBeenCalledWith({ email: user.email, password });
  expect(useAuth.getState()).toMatchObject({ isAuth: true, user });
});

it('при неверном пароле показывает ошибку и оставляет форму открытой', async () => {
  vi.mocked(authApi.login).mockRejectedValue(
    new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { detail: 'Неверные данные' },
    }),
  );
  const close = vi.fn();
  render(<ModalLogin isOpen setWindow={vi.fn()} setModalOpen={close} />);
  await userEvent.type(screen.getByLabelText('Электронная почта'), user.email);
  await userEvent.type(screen.getByPlaceholderText('Введите пароль'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
  expect(
    await screen.findByText('Неверная почта или пароль'),
  ).toBeInTheDocument();
  expect(close).not.toHaveBeenCalled();
  expect(useAuth.getState().isAuth).toBe(false);
});

it('регистрирует по Enter с составным именем и международным телефоном', async () => {
  vi.mocked(authApi.registration).mockResolvedValue(user);
  const close = vi.fn();
  render(<ModalRegistration isOpen setWindow={vi.fn()} setModalOpen={close} />);
  await userEvent.type(
    screen.getByLabelText('Строка для ввода имени'),
    user.first_name,
  );
  await userEvent.type(
    screen.getByLabelText('Строка для ввода фамилии'),
    user.last_name,
  );
  await userEvent.type(
    screen.getByLabelText('Номер телефона'),
    user.phone_number,
  );
  await userEvent.type(
    screen.getByLabelText('Строка для ввода электронной почты'),
    user.email,
  );
  await userEvent.type(
    screen.getByLabelText('Строка для ввода пароля'),
    password,
  );
  await userEvent.type(
    screen.getByLabelText('Строка для повторного ввода пароля'),
    password + '{Enter}',
  );
  await waitFor(() => expect(close).toHaveBeenCalledWith(false));
  expect(authApi.registration).toHaveBeenCalledWith({
    first_name: user.first_name,
    last_name: user.last_name,
    phone_number: user.phone_number,
    email: user.email,
    password,
  });
  expect(useAuth.getState()).toMatchObject({ isAuth: true, user });
});

it('проверяет обязательные поля регистрации до запроса к серверу', async () => {
  render(
    <ModalRegistration isOpen setWindow={vi.fn()} setModalOpen={vi.fn()} />,
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Зарегистрироваться' }),
  );
  expect(screen.getByLabelText('Строка для ввода имени')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  expect(
    screen.getByLabelText('Номер телефона', { exact: false }),
  ).toHaveAttribute('aria-invalid', 'true');
  expect(
    screen.getByText('Повторите пароль', { selector: 'p' }),
  ).toBeInTheDocument();
  expect(authApi.registration).not.toHaveBeenCalled();
});

it('показывает ответ о занятой почте и убирает его при исправлении поля', async () => {
  vi.mocked(authApi.registration).mockRejectedValue(
    new AxiosError(
      'Unprocessable Entity',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: { detail: 'Пользователь с таким email уже существует' },
      },
    ),
  );
  const close = vi.fn();
  render(<ModalRegistration isOpen setWindow={vi.fn()} setModalOpen={close} />);
  for (const [label, value] of [
    ['Строка для ввода имени', user.first_name],
    ['Строка для ввода фамилии', user.last_name],
    ['Номер телефона', user.phone_number],
    ['Строка для ввода электронной почты', user.email],
    ['Строка для ввода пароля', password],
    ['Строка для повторного ввода пароля', password],
  ])
    await userEvent.type(screen.getByLabelText(label), value);
  await userEvent.click(
    screen.getByRole('button', { name: 'Зарегистрироваться' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Пользователь с таким email уже существует',
  );
  expect(close).not.toHaveBeenCalled();
  await userEvent.type(
    screen.getByLabelText('Строка для ввода электронной почты'),
    'x',
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
