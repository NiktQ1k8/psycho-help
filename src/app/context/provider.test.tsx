import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '@/entities/auth/api';
import { useAuth } from '@/entities/auth/model/useAuth';
import type { TUser } from '@/entities/auth/types';
import { useAppContext } from './';
import { AppContextProvider } from './provider';

vi.mock('@/entities/auth/api', () => ({
  authApi: { getUser: vi.fn() },
}));

const user: TUser = {
  id: 'test-user',
  first_name: 'Иван',
  last_name: 'Иванов',
  middle_name: null,
  email: 'student@example.com',
  phone_number: '+79990000000',
  social_media: null,
  study_group: null,
  roles: [{ code: 'user', name: 'Пользователь', description: null }],
};

const Content = () => {
  const { isAppLoading } = useAppContext();
  return isAppLoading ? null : <div>Страница приложения</div>;
};

describe('Initial session check', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuth.getState().resetSession();
  });

  it('offers a retry after a network failure and restores the session', async () => {
    vi.mocked(authApi.getUser)
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce(user);
    render(
      <MemoryRouter>
        <AppContextProvider>
          <Content />
        </AppContextProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('Не удалось проверить авторизацию'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Страница приложения')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));

    expect(await screen.findByText('Страница приложения')).toBeInTheDocument();
    expect(useAuth.getState().isAuth).toBe(true);
    expect(useAuth.getState().user).toEqual(user);
    expect(authApi.getUser).toHaveBeenCalledTimes(2);
  });

  it('opens the public application when there is no valid session', async () => {
    vi.mocked(authApi.getUser).mockRejectedValueOnce(
      new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: { detail: 'Пользователь не авторизован' },
      }),
    );
    render(
      <MemoryRouter>
        <AppContextProvider>
          <Content />
        </AppContextProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(authApi.getUser).toHaveBeenCalledOnce());
    expect(await screen.findByText('Страница приложения')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Повторить' }),
    ).not.toBeInTheDocument();
    expect(useAuth.getState().isAuth).toBe(false);
  });

  it.each(['/logout', '/reset-password?token=demo-token'])(
    'не блокирует служебную страницу %s проверкой профиля',
    async (route) => {
      render(
        <MemoryRouter initialEntries={[route]}>
          <AppContextProvider>
            <Content />
          </AppContextProvider>
        </MemoryRouter>,
      );
      expect(
        await screen.findByText('Страница приложения'),
      ).toBeInTheDocument();
      expect(authApi.getUser).not.toHaveBeenCalled();
    },
  );
});
