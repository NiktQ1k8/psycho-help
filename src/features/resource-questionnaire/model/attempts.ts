import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { TTestAnswer } from '@/entities/test/types';
import { optionalSessionStorage } from '@/shared/lib/session-storage';

export type TQuestionnaireDraft = {
  questionIndex: number;
  answers: Record<string, { optionId?: string; text?: string }>;
};

type TTestDraft = {
  attemptId: string;
  questionId: string;
  answer: TTestAnswer;
};

type TUserAttempts = {
  testAttemptIds: Record<string, string>;
  surveys: Record<string, boolean>;
  drafts: Record<string, TQuestionnaireDraft>;
};

interface IResourceAttempts {
  users: Record<string, TUserAttempts>;
  testDrafts: Record<string, Record<string, TTestDraft>>;
  setDraft: (userId: string, key: string, draft: TQuestionnaireDraft) => void;
  clearUserDrafts: (userId: string) => void;
  rememberTestAttempt: (
    userId: string,
    testId: string,
    attemptId: string,
  ) => void;
  setTestDraft: (userId: string, testId: string, draft: TTestDraft) => void;
  clearTestDraft: (userId: string, testId: string) => void;
  completeSurvey: (userId: string, surveyId: string) => void;
}

const emptyAttempts: TUserAttempts = {
  testAttemptIds: {},
  surveys: {},
  drafts: {},
};

export const useResourceAttempts = create<IResourceAttempts>()(
  persist(
    (set) => ({
      users: {},
      testDrafts: {},
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
      clearUserDrafts: (userId) =>
        set((state) => {
          const user = state.users[userId];
          const testDrafts = { ...state.testDrafts };
          delete testDrafts[userId];
          return {
            testDrafts,
            users: user
              ? { ...state.users, [userId]: { ...user, drafts: {} } }
              : state.users,
          };
        }),
      rememberTestAttempt: (userId, testId, attemptId) =>
        set((state) => {
          const user = state.users[userId] ?? emptyAttempts;
          return {
            users: {
              ...state.users,
              [userId]: {
                ...user,
                testAttemptIds: { ...user.testAttemptIds, [testId]: attemptId },
              },
            },
          };
        }),
      setTestDraft: (userId, testId, draft) =>
        set((state) => ({
          testDrafts: {
            ...state.testDrafts,
            [userId]: { ...state.testDrafts[userId], [testId]: draft },
          },
        })),
      clearTestDraft: (userId, testId) =>
        set((state) => {
          const drafts = { ...state.testDrafts[userId] };
          delete drafts[testId];
          return { testDrafts: { ...state.testDrafts, [userId]: drafts } };
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
      storage: createJSONStorage(() => optionalSessionStorage),
      partialize: ({ users }) => ({ users }),
    },
  ),
);
