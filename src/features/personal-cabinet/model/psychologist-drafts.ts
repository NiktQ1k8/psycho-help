import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { TMeetingType } from '@/entities/application/types';

export type TPsychologistReasonDraftType = 'application' | 'appointment';

type TReasonDrafts = Record<
  TPsychologistReasonDraftType,
  Record<string, string>
>;

export type TOfferDraft = {
  psychologistId?: string;
  meetingType?: TMeetingType;
  date?: string;
  time?: string;
  locationAddress?: string;
  meetingUrl?: string;
};

interface IPsychologistDraftsState {
  reasonDrafts: TReasonDrafts;
  conclusionDrafts: Record<string, string>;
  offerDrafts: Record<string, TOfferDraft>;
  setOfferDraft: (id: string, patch: TOfferDraft) => void;
  clearOfferDraft: (id: string) => void;
  setReasonDraft: (
    type: TPsychologistReasonDraftType,
    entityId: string,
    reason: string,
  ) => void;
  clearReasonDraft: (
    type: TPsychologistReasonDraftType,
    entityId: string,
  ) => void;
  setConclusionDraft: (appointmentId: string, conclusion: string) => void;
  clearConclusionDraft: (appointmentId: string) => void;
}

const omitKey = <T>(record: Record<string, T>, key: string) => {
  const { [key]: _removed, ...rest } = record;
  return rest;
};

export const usePsychologistDrafts = create<IPsychologistDraftsState>()(
  persist(
    (set) => ({
      reasonDrafts: {
        application: {},
        appointment: {},
      },
      conclusionDrafts: {},
      offerDrafts: {},
      setOfferDraft: (id, patch) =>
        set((state) => ({
          offerDrafts: {
            ...state.offerDrafts,
            [id]: { ...state.offerDrafts[id], ...patch },
          },
        })),
      clearOfferDraft: (id) =>
        set((state) => ({ offerDrafts: omitKey(state.offerDrafts, id) })),

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
