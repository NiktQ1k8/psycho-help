import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TScheduleDraft = {
  date?: string;
  time?: string;
  venue?: string;
};

interface IPsychologistDraftsState {
  reasonDrafts: Record<string, string>;
  emergencyCancellationDrafts: Record<string, boolean>;
  setEmergencyCancellation: (id: string, isEmergency: boolean) => void;
  patientCommentDrafts: Record<string, string>;
  psychologistCommentDrafts: Record<string, string>;
  scheduleDrafts: Record<string, TScheduleDraft>;
  setScheduleDraft: (id: string, patch: TScheduleDraft) => void;
  clearScheduleDraft: (id: string) => void;
  clearAppointmentDrafts: (id: string) => void;
  setReasonDraft: (appointmentId: string, reason: string) => void;
  setPatientCommentDraft: (appointmentId: string, comment: string) => void;
  setPsychologistCommentDraft: (appointmentId: string, comment: string) => void;
}

const omitKey = <T>(record: Record<string, T>, key: string) => {
  const { [key]: _removed, ...rest } = record;
  return rest;
};

export const usePsychologistDrafts = create<IPsychologistDraftsState>()(
  persist(
    (set) => ({
      reasonDrafts: {},
      emergencyCancellationDrafts: {},
      setEmergencyCancellation: (id, isEmergency) =>
        set((state) => ({
          emergencyCancellationDrafts: {
            ...state.emergencyCancellationDrafts,
            [id]: isEmergency,
          },
        })),
      patientCommentDrafts: {},
      psychologistCommentDrafts: {},
      scheduleDrafts: {},
      clearAppointmentDrafts: (id) =>
        set((state) => ({
          reasonDrafts: omitKey(state.reasonDrafts, id),
          emergencyCancellationDrafts: omitKey(
            state.emergencyCancellationDrafts,
            id,
          ),
          patientCommentDrafts: omitKey(state.patientCommentDrafts, id),
          psychologistCommentDrafts: omitKey(
            state.psychologistCommentDrafts,
            id,
          ),
          scheduleDrafts: omitKey(state.scheduleDrafts, id),
        })),
      setScheduleDraft: (id, patch) =>
        set((state) => ({
          scheduleDrafts: {
            ...state.scheduleDrafts,
            [id]: { ...state.scheduleDrafts[id], ...patch },
          },
        })),
      clearScheduleDraft: (id) =>
        set((state) => ({ scheduleDrafts: omitKey(state.scheduleDrafts, id) })),

      setReasonDraft: (appointmentId, reason) =>
        set((state) => ({
          reasonDrafts: {
            ...state.reasonDrafts,
            [appointmentId]: reason,
          },
        })),

      setPatientCommentDraft: (appointmentId, comment) =>
        set((state) => ({
          patientCommentDrafts: {
            ...state.patientCommentDrafts,
            [appointmentId]: comment,
          },
        })),

      setPsychologistCommentDraft: (appointmentId, comment) =>
        set((state) => ({
          psychologistCommentDrafts: {
            ...state.psychologistCommentDrafts,
            [appointmentId]: comment,
          },
        })),
    }),
    {
      name: 'psychologist-appointment-drafts',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
