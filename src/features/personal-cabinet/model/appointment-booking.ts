import { create } from 'zustand';
import type {
  TAppointmentCreateRequest,
  TAppointmentType,
} from '@/entities/appointment/types';

interface IAppointmentBooking {
  appointment: TAppointmentBooking;
  createdAppointmentId: string | null;
  selectedOffices: string[];
  scheduleDate: string | null;
  landingFormat: TAppointmentType;
  setLandingFormat: (format: TAppointmentType) => void;
  setScheduleDate: (date: string) => void;
  setType: (type: TAppointmentType) => void;
  setSelectedOffices: (offices: string[]) => void;
  setAppointment: (patch: TAppointmentBooking) => void;
  setCreatedAppointmentId: (id: string) => void;
  resetAppointment: () => void;
}

type TAppointmentBooking = Partial<
  Pick<
    TAppointmentCreateRequest,
    | 'psychologist_id'
    | 'type'
    | 'duration'
    | 'scheduled_time'
    | 'reason'
    | 'venue'
    | 'comment'
  >
> & {
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
  scheduleDate: null,
  landingFormat: 'Offline',
  setLandingFormat: (landingFormat) => set({ landingFormat }),
  setScheduleDate: (scheduleDate) =>
    set((state) => ({
      scheduleDate,
      appointment: { ...state.appointment, scheduled_time: undefined },
    })),
  setType: (type) =>
    set((state) => {
      if (state.appointment.type === type) return state;
      return {
        appointment: {
          ...state.appointment,
          type,
          scheduled_time: undefined,
          venue: undefined,
        },
        selectedOffices: [],
      };
    }),
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
      scheduleDate: null,
      landingFormat: 'Offline',
      selectedOffices: [],
    }),
}));
