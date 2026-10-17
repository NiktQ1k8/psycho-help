import { create } from 'zustand';
import { authApi } from '@/entities/auth/api';
import type { TRegistrationData, TUser } from '@/entities/auth/types';
import { queryClient } from '@/shared/api/queryClient';

type TAuthState = {
  isAuth: boolean;
  user: TUser | null;
  setUser: (user: TUser | null) => void;
  resetSession: () => void;
  login: (email: string, password: string) => Promise<TUser>;
  registration: (data: TRegistrationData) => Promise<TUser>;
  getUser: () => Promise<TUser>;
  logOut: () => Promise<void>;
};

let userPromise: Promise<TUser> | null = null;

export const useAuth = create<TAuthState>((set, get) => ({
  isAuth: false,
  user: null,

  setUser: (user) => set({ user }),
  resetSession: () => {
    queryClient.clear();
    set({ isAuth: false, user: null });
  },

  async login(email, password) {
    const user = await authApi.login({ email, password });
    queryClient.clear();
    set({ isAuth: true, user });
    return user;
  },

  async registration(data) {
    const user = await authApi.registration(data);
    queryClient.clear();
    set({ isAuth: true, user });
    return user;
  },

  getUser() {
    if (!userPromise) {
      userPromise = authApi
        .getUser()
        .then((user) => {
          set({ isAuth: true, user });
          return user;
        })
        .finally(() => {
          userPromise = null;
        });
    }
    return userPromise;
  },

  async logOut() {
    await authApi.logout();
    get().resetSession();
  },
}));
