import { isAxiosError } from 'axios';
import { $api, $serviceClient } from '@/shared/api/http';
import type { TMessageResponse } from '@/shared/api/types';
import type {
  TLoginData,
  TPasswordResetConfirmRequest,
  TPasswordResetRequest,
  TRegistrationData,
  TUser,
  TUserPasswordUpdate,
  TUserProfileUpdate,
} from './types';

let refreshPromise: Promise<void> | null = null;

export const refreshSession = (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = $serviceClient
      .post('/users/refresh')
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

export const authApi = {
  login: async (data: TLoginData): Promise<TUser> => {
    const response = await $serviceClient.post<TUser>('/users/login', data);
    return response.data;
  },

  registration: async (data: TRegistrationData): Promise<TUser> => {
    const response = await $serviceClient.post<TUser>('/users/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await $api.post<TMessageResponse>('/users/logout');
    } catch (error) {
      // После неудачного refresh сессии уже нет. Остальные ошибки не скрываем.
      if (!isAxiosError(error) || error.response?.status !== 401) throw error;
    }
  },

  getUser: async (signal?: AbortSignal): Promise<TUser> => {
    return (await $api.get<TUser>('/users/user', { signal })).data;
  },

  updateProfile: async (data: TUserProfileUpdate): Promise<TUser> => {
    const response = await $api.put<TUser>('/users/me', data);
    return response.data;
  },

  updatePassword: async (
    data: TUserPasswordUpdate,
  ): Promise<TMessageResponse> => {
    return (await $api.post<TMessageResponse>('/users/me/password', data)).data;
  },

  requestPasswordReset: async (
    data: TPasswordResetRequest,
  ): Promise<TMessageResponse> => {
    return (
      await $serviceClient.post<TMessageResponse>(
        '/users/password-reset/request',
        data,
      )
    ).data;
  },

  resetPassword: async (
    data: TPasswordResetConfirmRequest,
  ): Promise<TMessageResponse> => {
    return (
      await $serviceClient.post<TMessageResponse>(
        '/users/password-reset/confirm',
        data,
      )
    ).data;
  },
};
