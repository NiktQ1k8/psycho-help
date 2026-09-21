import { act } from '@testing-library/react';
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
    vi.clearAllMocks();
  });

  it('По умолчанию сбросанные данные', () => {
    const state = useAuth.getState();
    expect(state.isAuth).toBe(false);
    expect(state.user).toBeNull();
  });

  it('Исправная работа метода setAuth', () => {
    act(() => {
      useAuth.getState().setAuth(true);
    });

    expect(useAuth.getState().isAuth).toBe(true);
  });

  it('Исправная работа метода setUser', () => {
    act(() => {
      useAuth.getState().setUser(mockUser);
    });

    expect(useAuth.getState().user).toEqual(mockUser);
  });

  it('login() вызывает AuthApi.login и устанавливает пользователя', async () => {
    vi.mocked(AuthApi.login).mockResolvedValueOnce({
      data: mockUser,
    } as AxiosResponse<User>);
    vi.mocked(AuthApi.getUser).mockResolvedValueOnce({
      data: mockUser,
    } as AxiosResponse<User>);

    await act(async () => {
      await useAuth.getState().login('darklord@example.com', '666');
    });

    const state = useAuth.getState();
    expect(AuthApi.login).toHaveBeenCalledWith('darklord@example.com', '666');
    expect(state.isAuth).toBe(true);
    expect(state.user).toEqual(mockUser);
  });

  it('registration() вызывает AuthApi.register и устанавливает пользователя', async () => {
    vi.mocked(AuthApi.registration).mockResolvedValueOnce({
      data: mockUser,
    } as AxiosResponse<User>);

    await act(async () => {
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
    });

    const state = useAuth.getState();
    expect(AuthApi.registration).toHaveBeenCalledOnce();
    expect(state.isAuth).toBe(true);
    expect(state.user).toEqual(mockUser);
  });

  it('logout() вызывает AuthApi.logOut и очищает состояние', async () => {
    vi.mocked(AuthApi.logOut).mockResolvedValueOnce({
      data: {},
    } as AxiosResponse);

    await act(async () => {
      await useAuth.getState().logOut();
    });

    const state = useAuth.getState();
    expect(AuthApi.logOut).toHaveBeenCalledOnce();
    expect(state.isAuth).toBe(false);
    expect(state.user).toBeNull();
  });
});
