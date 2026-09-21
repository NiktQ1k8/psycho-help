import type { AxiosResponse } from 'axios';
import { create } from 'zustand';
import type { RegistrationData, User } from '@/entities/auth';
import AuthApi from './auth-api';

type Tauth = {
  isAuth: boolean;
  user: User | null;
  setAuth: (value: boolean) => void;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<AxiosResponse<User>>;
  registration: (data: RegistrationData) => Promise<AxiosResponse<User>>;
  getUser: () => Promise<AxiosResponse<User>>;
  logOut: () => Promise<AxiosResponse>;
};

export const useAuth = create<Tauth>((set, _get) => ({
  isAuth: false,
  user: null,
  remember_me: false,

  setAuth: (value: boolean) => set((state) => ({ ...state, isAuth: value })),

  setUser: (user: User | null) =>
    set((state) => ({ ...state, user: user ? { ...user } : null })),

  async login(email: string, password: string): Promise<AxiosResponse<User>> {
    const res = await AuthApi.login(email, password);
    const userRes = await AuthApi.getUser();
    set((state) => ({ ...state, isAuth: true, user: { ...userRes.data } }));
    return res;
  },

  async registration(data: RegistrationData): Promise<AxiosResponse<User>> {
    const res = await AuthApi.registration(data);
    set((state) => ({ ...state, isAuth: true, user: { ...res.data } }));
    return res;
  },

  async getUser(): Promise<AxiosResponse<User>> {
    const res = await AuthApi.getUser();
    set((state) => ({ ...state, isAuth: true, user: { ...res.data } }));
    return res;
  },

  async logOut(): Promise<AxiosResponse> {
    const res = await AuthApi.logOut();
    set(() => ({ isAuth: false, user: null }));
    return res;
  },
}));
