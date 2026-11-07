import { create } from 'zustand';
import type { TProfileFormData } from '@/entities/auth/model/profile-form';
import type {
  TTherapistStatus,
  TTherapistStatusRequest,
} from '@/entities/therapist/types';

export type TAbsenceDraft = {
  editing: TTherapistStatus | null;
  status: TTherapistStatusRequest['status'];
  start: string | null;
  end: string | null;
};

type TCabinetDraftsState = {
  profile: Partial<TProfileFormData>;
  cancellationReasons: Record<string, string>;
  emergencyContacts: Record<string, string>;
  absence: TAbsenceDraft | null;
  setProfile: (patch: Partial<TProfileFormData>) => void;
  clearProfile: () => void;
  setEmergencyContact: (id: string, contact: string) => void;
  clearEmergencyContact: (id: string) => void;
  setAbsence: (patch: Partial<TAbsenceDraft>) => void;
  clearAbsence: () => void;
  setCancellationReason: (id: string, reason: string) => void;
  clearCancellationReason: (id: string) => void;
};

export const useCabinetDrafts = create<TCabinetDraftsState>((set) => ({
  profile: {},
  cancellationReasons: {},
  emergencyContacts: {},
  absence: null,
  setProfile: (patch) =>
    set((state) => ({ profile: { ...state.profile, ...patch } })),
  clearProfile: () => set({ profile: {} }),
  setEmergencyContact: (id, contact) =>
    set((state) => ({
      emergencyContacts: { ...state.emergencyContacts, [id]: contact },
    })),
  clearEmergencyContact: (id) =>
    set((state) => {
      const { [id]: _removed, ...rest } = state.emergencyContacts;
      return { emergencyContacts: rest };
    }),
  setAbsence: (patch) =>
    set((state) => ({
      absence: {
        editing: null,
        status: 'vacation',
        start: null,
        end: null,
        ...state.absence,
        ...patch,
      },
    })),
  clearAbsence: () => set({ absence: null }),
  setCancellationReason: (id, reason) =>
    set((state) => ({
      cancellationReasons: { ...state.cancellationReasons, [id]: reason },
    })),
  clearCancellationReason: (id) =>
    set((state) => {
      const { [id]: _removed, ...rest } = state.cancellationReasons;
      return { cancellationReasons: rest };
    }),
}));
