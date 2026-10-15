import { StrictMode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, expect, it, vi } from 'vitest';
import { authApi } from '@/entities/auth/api';
import { useAuth } from '@/entities/auth/model/useAuth';
import type { TUser } from '@/entities/auth/types';
import { queryClient } from '@/shared/api/queryClient';
import Logout from './Logout';

vi.mock('@/entities/auth/api', () => ({ authApi: { logout: vi.fn() } }));
const user: TUser = {
  id: 'test-user',
  first_name: 'Иван',
  last_name: 'Иванов',
  middle_name: null,
  phone_number: '+79990000000',
  email: 'student@example.com',
  social_media: null,
  study_group: null,
  roles: [{ code: 'user', name: 'Пользователь', description: null }],
};
beforeEach(() => {
  vi.resetAllMocks();
  useAuth.setState({ isAuth: true, user });
  queryClient.clear();
});
const renderLogout = () =>
  render(
    <StrictMode>
      <MemoryRouter initialEntries={['/logout']}>
        <Routes>
          <Route path="/logout" element={<Logout />} />
          <Route path="/" element={<div>Главная страница</div>} />
        </Routes>
      </MemoryRouter>
    </StrictMode>,
  );

it('выходит и переходит на главную, отправляя один запрос в StrictMode', async () => {
  vi.mocked(authApi.logout).mockResolvedValue(undefined);
  queryClient.setQueryData(['application.list'], ['private data']);
  renderLogout();
  expect(await screen.findByText('Главная страница')).toBeInTheDocument();
  expect(authApi.logout).toHaveBeenCalledOnce();
  expect(useAuth.getState()).toMatchObject({ isAuth: false, user: null });
  expect(queryClient.getQueryData(['application.list'])).toBeUndefined();
});

it('при ошибке выхода показывает причину и позволяет повторить запрос', async () => {
  vi.mocked(authApi.logout)
    .mockRejectedValueOnce(
      new AxiosError(
        'Request failed',
        'ERR_BAD_RESPONSE',
        undefined,
        undefined,
        {
          status: 503,
          statusText: 'Unavailable',
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: {},
        },
      ),
    )
    .mockResolvedValueOnce(undefined);
  renderLogout();
  expect(
    await screen.findByText(
      'Не удалось выйти из аккаунта. Ошибка сервера — попробуйте позже',
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText('Главная страница')).not.toBeInTheDocument();
  expect(useAuth.getState().isAuth).toBe(true);
  await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
  expect(await screen.findByText('Главная страница')).toBeInTheDocument();
  expect(authApi.logout).toHaveBeenCalledTimes(2);
});
