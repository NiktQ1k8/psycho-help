import { create } from 'zustand';
import type {
  TAppointmentCreateRequest,
  TAppointmentType,
} from '@/entities/appointment/types';

interface IAppointmentBooking {
  appointment: TAppointmentBooking;
  createdAppointmentId: string | null;
  selectedOffices: string[];
  setType: (type: TAppointmentType) => void;
  setSelectedOffices: (offices: string[]) => void;
  setAppointment: (patch: TAppointmentBooking) => void;
  setCreatedAppointmentId: (id: string) => void;
  resetAppointment: () => void;
}

type TAppointmentBooking = Partial<TAppointmentCreateRequest> & {
  emergency_contact?: string;
};

const defaultAppointment: TAppointmentBooking = {
  reason: '',
  duration: 60,
};

export const useAppointmentBooking = create<IAppointmentBooking>((set) => ({
  appointment: { ...defaultAppointment },
  createdAppointmentId: null,
  selectedOffices: [],
  setType: (type) =>
    set((state) => ({
      appointment: {
        ...state.appointment,
        type,
        scheduled_time: undefined,
        venue: undefined,
      },
      selectedOffices: [],
    })),
  setSelectedOffices: (selectedOffices) =>
    set((state) => ({
      selectedOffices,
      appointment: { ...state.appointment, scheduled_time: undefined },
    })),
  setAppointment: (patch) =>
    set((state) => ({ appointment: { ...state.appointment, ...patch } })),
  setCreatedAppointmentId: (createdAppointmentId) =>
    set({ createdAppointmentId }),
  resetAppointment: () =>
    set({
      appointment: { ...defaultAppointment },
      createdAppointmentId: null,
      selectedOffices: [],
    }),
}));
