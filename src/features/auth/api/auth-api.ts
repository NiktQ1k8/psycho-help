import type { AxiosResponse } from 'axios';
import type {
  RegistrationData,
  User,
  UserPasswordUpdate,
  UserProfileUpdate,
} from '@/entities/auth';
import { $serviceClient } from '@/shared/api/http';

export default class AuthApi {
  static async login(
    email: string,
    password: string,
  ): Promise<AxiosResponse<User>> {
    const res = await $serviceClient.post<User>('/users/login', {
      email,
      password,
    });
    return res;
  }

  static async registration(
    data: RegistrationData,
  ): Promise<AxiosResponse<User>> {
    const res = await $serviceClient.post<User>('/users/register', { ...data });
    return res;
  }

  static async getUser(): Promise<AxiosResponse<User>> {
    const res = await $serviceClient.get<User>('/users/user');
    return res;
  }

  static async logOut(): Promise<AxiosResponse> {
    const res = await $serviceClient.post('/users/logout');
    return res;
  }

  static async updateProfile(
    data: UserProfileUpdate,
  ): Promise<AxiosResponse<User>> {
    const res = await $serviceClient.put<User>('/users/me', data);
    return res;
  }
  static async updatePassword(
    data: UserPasswordUpdate,
  ): Promise<AxiosResponse<User>> {
    const res = await $serviceClient.post<User>('/users/me/password', data);
    return res;
  }
}
