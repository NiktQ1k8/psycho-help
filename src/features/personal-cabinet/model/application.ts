import { create } from 'zustand';
import type { TApplicationCreateRequest } from '@/entities/application/types';

interface IApplication {
  application: Partial<TApplicationCreateRequest>;
  setApplication: (patch: Partial<TApplicationCreateRequest>) => void;
  resetApplication: () => void;
}

const defaultState: Partial<TApplicationCreateRequest> = {
  problem_description: '',
  university_status: 'студент',
};

export const useApplication = create<IApplication>((set) => ({
  application: { ...defaultState },
  setApplication: (patch) =>
    set((state) => ({
      application: {
        ...state.application,
        ...patch,
      },
    })),
  resetApplication: () => set({ application: { ...defaultState } }),
}));
