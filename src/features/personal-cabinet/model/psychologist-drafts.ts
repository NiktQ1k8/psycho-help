import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type PsychologistReasonDraftType = 'application' | 'appointment';

type ReasonDrafts = Record<PsychologistReasonDraftType, Record<string, string>>;

interface PsychologistDraftsState {
  reasonDrafts: ReasonDrafts;
  conclusionDrafts: Record<string, string>;
  setReasonDraft: (
    type: PsychologistReasonDraftType,
    entityId: string,
    reason: string,
  ) => void;
  clearReasonDraft: (
    type: PsychologistReasonDraftType,
    entityId: string,
  ) => void;
  setConclusionDraft: (appointmentId: string, conclusion: string) => void;
  clearConclusionDraft: (appointmentId: string) => void;
}

const omitKey = <T>(record: Record<string, T>, key: string) => {
  const { [key]: _removed, ...rest } = record;
  return rest;
};

export const usePsychologistDrafts = create<PsychologistDraftsState>()(
  persist(
    (set) => ({
      reasonDrafts: {
        application: {},
        appointment: {},
      },
      conclusionDrafts: {},

      setReasonDraft: (type, entityId, reason) =>
        set((state) => ({
          reasonDrafts: {
            ...state.reasonDrafts,
            [type]: {
              ...(state.reasonDrafts[type] ?? {}),
              [entityId]: reason,
            },
          },
        })),

      clearReasonDraft: (type, entityId) =>
        set((state) => ({
          reasonDrafts: {
            ...state.reasonDrafts,
            [type]: omitKey(state.reasonDrafts[type] ?? {}, entityId),
          },
        })),

      setConclusionDraft: (appointmentId, conclusion) =>
        set((state) => ({
          conclusionDrafts: {
            ...state.conclusionDrafts,
            [appointmentId]: conclusion,
          },
        })),

      clearConclusionDraft: (appointmentId) =>
        set((state) => ({
          conclusionDrafts: omitKey(state.conclusionDrafts, appointmentId),
        })),
    }),
    {
      name: 'psychologist-drafts',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
