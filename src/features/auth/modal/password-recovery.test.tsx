import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, expect, it, vi } from 'vitest';
import { authApi } from '@/entities/auth/api';
import ResetPassword from '@/pages/ResetPassword/ResetPassword';
import ModalForgotPassword from './modal-forgot-password';

vi.mock('@/entities/auth/api', () => ({
  authApi: { requestPasswordReset: vi.fn(), resetPassword: vi.fn() },
}));
beforeEach(() => vi.resetAllMocks());

it('запрашивает письмо через API и показывает подтверждение только после успеха', async () => {
  const text =
    'Если пользователь с таким email существует, письмо для восстановления пароля будет отправлено';
  vi.mocked(authApi.requestPasswordReset).mockResolvedValue({ message: text });
  const close = vi.fn();
  render(
    <ModalForgotPassword isOpen setWindow={vi.fn()} setModalOpen={close} />,
  );
  await userEvent.type(
    screen.getByLabelText('Электронная почта'),
    'student@example.com{Enter}',
  );
  expect(await screen.findByRole('status')).toHaveTextContent(text);
  expect(authApi.requestPasswordReset).toHaveBeenCalledWith({
    email: 'student@example.com',
  });
  expect(close).not.toHaveBeenCalled();
});

it.each([
  {
    cause: 'сбое сети',
    error: new AxiosError('Network Error', 'ERR_NETWORK'),
    message: 'Не удалось связаться с сервером',
  },
  {
    cause: 'ошибке почтового сервиса',
    error: new AxiosError(
      'Server Error',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: {
          detail: 'Не удалось отправить письмо для восстановления пароля',
        },
      },
    ),
    message:
      'Не удалось отправить письмо для восстановления пароля. Ошибка сервера',
  },
])(
  'при $cause не закрывает восстановление и не сообщает об отправленном письме',
  async ({ error, message }) => {
    vi.mocked(authApi.requestPasswordReset).mockRejectedValue(error);
    const close = vi.fn();
    render(
      <ModalForgotPassword isOpen setWindow={vi.fn()} setModalOpen={close} />,
    );
    await userEvent.type(
      screen.getByLabelText('Электронная почта'),
      'student@example.com{Enter}',
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByText('Проверьте почту')).not.toBeInTheDocument();
    expect(close).not.toHaveBeenCalled();
  },
);

it('сохраняет новый пароль с токеном из ссылки без запроса старого пароля', async () => {
  vi.mocked(authApi.resetPassword).mockResolvedValue({
    message: 'Пароль успешно изменён',
  });
  render(
    <MemoryRouter initialEntries={['/reset-password?token=demo-token']}>
      <ResetPassword />
    </MemoryRouter>,
  );
  expect(screen.queryByText('Текущий пароль')).not.toBeInTheDocument();
  await userEvent.type(
    screen.getByLabelText('Новый пароль'),
    'NewPassword123!',
  );
  await userEvent.type(
    screen.getByLabelText('Повторите пароль'),
    'NewPassword123!{Enter}',
  );
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Пароль успешно изменён',
  );
  expect(authApi.resetPassword).toHaveBeenCalledWith({
    token: 'demo-token',
    new_password: 'NewPassword123!',
  });
  await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
  expect(screen.getByLabelText('Электронная почта')).toBeInTheDocument();
});

it('объясняет ошибку просроченной ссылки и предлагает запросить новую', async () => {
  vi.mocked(authApi.resetPassword).mockRejectedValue(
    new AxiosError('Bad Request', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {
        detail: 'Недействительная или истекшая ссылка восстановления пароля',
      },
    }),
  );
  render(
    <MemoryRouter initialEntries={['/reset-password?token=expired-token']}>
      <ResetPassword />
    </MemoryRouter>,
  );
  await userEvent.type(
    screen.getByLabelText('Новый пароль'),
    'NewPassword123!',
  );
  await userEvent.type(
    screen.getByLabelText('Повторите пароль'),
    'NewPassword123!{Enter}',
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Недействительная или истекшая ссылка восстановления пароля',
  );
  expect(
    screen.getByRole('button', { name: 'Сохранить пароль' }),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByText('Запросить новое письмо'));
  expect(screen.getByLabelText('Электронная почта')).toBeInTheDocument();
});
