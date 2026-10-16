import { create } from 'zustand';
import type {
  TApplicationCreateRequest,
  TMeetingType,
} from '@/entities/application/types';

interface IApplication {
  application: Partial<TApplicationCreateRequest>;
  meetingType: TMeetingType | null;
  selectedOffices: string[];
  setMeetingType: (meetingType: TMeetingType) => void;
  setSelectedOffices: (offices: string[]) => void;
  setApplication: (patch: Partial<TApplicationCreateRequest>) => void;
  resetApplication: () => void;
}

const defaultState: Partial<TApplicationCreateRequest> = {
  problem_description: '',
  university_status: 'студент',
};

export const useApplication = create<IApplication>((set) => ({
  application: { ...defaultState },
  meetingType: null,
  selectedOffices: [],
  setMeetingType: (meetingType) => set({ meetingType, selectedOffices: [] }),
  setSelectedOffices: (selectedOffices) => set({ selectedOffices }),
  setApplication: (patch) =>
    set((state) => ({
      application: {
        ...state.application,
        ...patch,
      },
    })),
  resetApplication: () =>
    set({
      application: { ...defaultState },
      meetingType: null,
      selectedOffices: [],
    }),
}));
