import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TScheduleDraft = {
  date?: string;
  time?: string;
  venue?: string;
  comment?: string;
};

interface IPsychologistDraftsState {
  reasonDrafts: Record<string, string>;
  patientCommentDrafts: Record<string, string>;
  psychologistCommentDrafts: Record<string, string>;
  scheduleDrafts: Record<string, TScheduleDraft>;
  setScheduleDraft: (id: string, patch: TScheduleDraft) => void;
  clearScheduleDraft: (id: string) => void;
  setReasonDraft: (appointmentId: string, reason: string) => void;
  clearReasonDraft: (appointmentId: string) => void;
  setPatientCommentDraft: (appointmentId: string, comment: string) => void;
  clearPatientCommentDraft: (appointmentId: string) => void;
  setPsychologistCommentDraft: (appointmentId: string, comment: string) => void;
  clearPsychologistCommentDraft: (appointmentId: string) => void;
}

const omitKey = <T>(record: Record<string, T>, key: string) => {
  const { [key]: _removed, ...rest } = record;
  return rest;
};

export const usePsychologistDrafts = create<IPsychologistDraftsState>()(
  persist(
    (set) => ({
      reasonDrafts: {},
      patientCommentDrafts: {},
      psychologistCommentDrafts: {},
      scheduleDrafts: {},
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

      clearReasonDraft: (appointmentId) =>
        set((state) => ({
          reasonDrafts: omitKey(state.reasonDrafts, appointmentId),
        })),

      setPatientCommentDraft: (appointmentId, comment) =>
        set((state) => ({
          patientCommentDrafts: {
            ...state.patientCommentDrafts,
            [appointmentId]: comment,
          },
        })),

      clearPatientCommentDraft: (appointmentId) =>
        set((state) => ({
          patientCommentDrafts: omitKey(
            state.patientCommentDrafts,
            appointmentId,
          ),
        })),

      setPsychologistCommentDraft: (appointmentId, comment) =>
        set((state) => ({
          psychologistCommentDrafts: {
            ...state.psychologistCommentDrafts,
            [appointmentId]: comment,
          },
        })),

      clearPsychologistCommentDraft: (appointmentId) =>
        set((state) => ({
          psychologistCommentDrafts: omitKey(
            state.psychologistCommentDrafts,
            appointmentId,
          ),
        })),
    }),
    {
      name: 'psychologist-appointment-drafts',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
