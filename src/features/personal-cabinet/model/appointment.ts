import { create } from 'zustand';
import type { TAppointmentCreateRequest } from '@/entities/appointment/types';

interface IAppointment {
  appointment: Partial<TAppointmentCreateRequest>;
  setAppointment: (patch: Partial<TAppointmentCreateRequest>) => void;
}

export const useAppointment = create<IAppointment>((set) => ({
  appointment: {
    psychologist_id: 'default',
    type: 'Online',
    reason: '',
    scheduled_time: '',
    remind_time: null,
    venue: '',
  },
  setAppointment: (patch) =>
    set((state) => ({
      appointment: {
        ...state.appointment,
        ...patch,
      },
    })),
}));
