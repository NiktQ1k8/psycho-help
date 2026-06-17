import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { TTestResult } from '@/entities/test/types';

export type TQuestionnaireDraft = {
  questionIndex: number;
  answers: Record<string, { optionId?: string; text?: string }>;
};

type TUserAttempts = {
  tests: Record<string, TTestResult>;
  surveys: Record<string, boolean>;
  drafts: Record<string, TQuestionnaireDraft>;
};

interface IResourceAttempts {
  users: Record<string, TUserAttempts>;
  setDraft: (userId: string, key: string, draft: TQuestionnaireDraft) => void;
  clearDraft: (userId: string, key: string) => void;
  clearUserDrafts: (userId: string) => void;
  saveTestResult: (userId: string, result: TTestResult) => void;
  completeSurvey: (userId: string, surveyId: string) => void;
}

const emptyAttempts: TUserAttempts = { tests: {}, surveys: {}, drafts: {} };

export const useResourceAttempts = create<IResourceAttempts>()(
  persist(
    (set) => ({
      users: {},
      setDraft: (userId, key, draft) =>
        set((state) => {
          const user = state.users[userId] ?? emptyAttempts;
          return {
            users: {
              ...state.users,
              [userId]: { ...user, drafts: { ...user.drafts, [key]: draft } },
            },
          };
        }),
      clearDraft: (userId, key) =>
        set((state) => {
          const user = state.users[userId];
          if (!user) return state;
          const drafts = { ...user.drafts };
          delete drafts[key];
          return { users: { ...state.users, [userId]: { ...user, drafts } } };
        }),
      clearUserDrafts: (userId) =>
        set((state) => {
          const user = state.users[userId];
          if (!user) return state;
          return {
            users: { ...state.users, [userId]: { ...user, drafts: {} } },
          };
        }),
      saveTestResult: (userId, result) =>
        set((state) => {
          const user = state.users[userId] ?? emptyAttempts;
          const drafts = { ...user.drafts };
          delete drafts[`test:${result.test_id}`];
          return {
            users: {
              ...state.users,
              [userId]: {
                ...user,
                tests: { ...user.tests, [result.test_id]: result },
                drafts,
              },
            },
          };
        }),
      completeSurvey: (userId, surveyId) =>
        set((state) => {
          const user = state.users[userId] ?? emptyAttempts;
          const drafts = { ...user.drafts };
          delete drafts[`survey:${surveyId}`];
          return {
            users: {
              ...state.users,
              [userId]: {
                ...user,
                surveys: { ...user.surveys, [surveyId]: true },
                drafts,
              },
            },
          };
        }),
    }),
    {
      name: 'resource-questionnaire-mock',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
