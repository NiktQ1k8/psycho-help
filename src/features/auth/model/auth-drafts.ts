import { create } from 'zustand';

type TRegistrationDraft = {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
};

interface IAuthDraftsState {
  loginEmail: string;
  forgotEmail: string;
  registration: TRegistrationDraft;
  setLoginEmail: (email: string) => void;
  setForgotEmail: (email: string) => void;
  setRegistration: (patch: Partial<TRegistrationDraft>) => void;
  clearRegistration: () => void;
}

const emptyRegistration: TRegistrationDraft = {
  first_name: '',
  last_name: '',
  phone_number: '',
  email: '',
};

export const useAuthDrafts = create<IAuthDraftsState>((set) => ({
  loginEmail: '',
  forgotEmail: '',
  registration: { ...emptyRegistration },
  setLoginEmail: (loginEmail) => set({ loginEmail }),
  setForgotEmail: (forgotEmail) => set({ forgotEmail }),
  setRegistration: (patch) =>
    set((state) => ({ registration: { ...state.registration, ...patch } })),
  clearRegistration: () => set({ registration: { ...emptyRegistration } }),
}));
