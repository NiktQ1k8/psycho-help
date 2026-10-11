import type { AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/entities/auth';
import AuthApi from './auth-api';
import { useAuth } from './useAuth';

vi.mock('./auth-api', () => ({
  default: {
    login: vi.fn(),
    registration: vi.fn(),
    getUser: vi.fn(),
    logOut: vi.fn(),
  },
}));

describe('useAuth Store', () => {
  const mockUser: User = {
    id: '1',
    first_name: 'Годжо',
    middle_name: null,
    last_name: 'Сатору',
    phone_number: '+7 999 999 99 99',
    email: 'gojosatoru@juju.com',
    social_media: 'tg',
    study_group: null,
    roles: [
      {
        code: 'user',
        name: 'Пользователь',
        description: 'Студент или преподаватель - обычный пользователь системы',
      },
    ],
  };

  beforeEach(() => {
    const { setAuth, setUser } = useAuth.getState();
    setAuth(false);
    setUser(null);
    vi.resetAllMocks();
  });

  it('По умолчанию сбросанные данные', () => {
    const state = useAuth.getState();
    expect(state.isAuth).toBe(false);
    expect(state.user).toBeNull();
  });

  it('Исправная работа метода setAuth', () => {
    useAuth.getState().setAuth(true);

    expect(useAuth.getState().isAuth).toBe(true);
  });

  it('Исправная работа метода setUser', () => {
    useAuth.getState().setUser(mockUser);

    expect(useAuth.getState().user).toEqual(mockUser);
  });

  it('login() вызывает AuthApi.login и устанавливает пользователя', async () => {
    vi.mocked(AuthApi.login).mockResolvedValueOnce({
      data: mockUser,
    } as AxiosResponse<User>);
    vi.mocked(AuthApi.getUser).mockResolvedValueOnce({
      data: mockUser,
    } as AxiosResponse<User>);

    await useAuth.getState().login('darklord@example.com', '666');

    const state = useAuth.getState();
    expect(AuthApi.login).toHaveBeenCalledWith('darklord@example.com', '666');
    expect(state.isAuth).toBe(true);
    expect(state.user).toEqual(mockUser);
  });

  it.each(['login', 'getUser'] as const)(
    'does not authenticate when %s fails during login',
    async (method) => {
      if (method === 'getUser') {
        vi.mocked(AuthApi.login).mockResolvedValueOnce({
          data: {},
        } as AxiosResponse<User>);
      }
      const error = new Error('Authentication failed');
      vi.mocked(AuthApi[method]).mockRejectedValueOnce(error);
      await expect(
        useAuth.getState().login('test@example.com', 'wrong'),
      ).rejects.toBe(error);
      expect(useAuth.getState().isAuth).toBe(false);
      expect(useAuth.getState().user).toBeNull();
      if (method === 'login') expect(AuthApi.getUser).not.toHaveBeenCalled();
    },
  );

  it('registration() вызывает AuthApi.register и устанавливает пользователя', async () => {
    vi.mocked(AuthApi.registration).mockResolvedValueOnce({
      data: mockUser,
    } as AxiosResponse<User>);

    await useAuth.getState().registration({
      first_name: mockUser.first_name,
      middle_name: mockUser.middle_name,
      last_name: mockUser.last_name,
      phone_number: mockUser.phone_number,
      email: mockUser.email,
      social_media: mockUser.social_media,
      password: 'tututututiti',
      study_group: mockUser.study_group,
    });

    const state = useAuth.getState();
    expect(AuthApi.registration).toHaveBeenCalledOnce();
    expect(state.isAuth).toBe(true);
    expect(state.user).toEqual(mockUser);
  });

  it('logout() вызывает AuthApi.logOut и очищает состояние', async () => {
    useAuth.setState({ isAuth: true, user: mockUser });
    vi.mocked(AuthApi.logOut).mockResolvedValueOnce({
      data: {},
    } as AxiosResponse);

    await useAuth.getState().logOut();

    const state = useAuth.getState();
    expect(AuthApi.logOut).toHaveBeenCalledOnce();
    expect(state.isAuth).toBe(false);
    expect(state.user).toBeNull();
  });
});
