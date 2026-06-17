import { $api } from '@/shared/api/http';
import { getImageSrc } from '@/shared/lib/getImageSrc';
import type {
  TPsyTest,
  TTestAnswer,
  TTestAttempt,
  TTestCreate,
  TTestQuestion,
  TTestQuestionInput,
  TTestUpdate,
} from '../types';

const catalogPath = '/psy-tests/';
const timeout = 15000;
const testPath = (testId: string) =>
  `${catalogPath}${encodeURIComponent(testId)}`;
const questionsPath = (testId: string) => `${testPath(testId)}/questions`;
const attemptsPath = (testId: string) => `${testPath(testId)}/attempts`;
const attemptPath = (testId: string, attemptId: string) =>
  `${attemptsPath(testId)}/${encodeURIComponent(attemptId)}`;
const questionImagePath = (testId: string, questionId: string) =>
  `${questionsPath(testId)}/${encodeURIComponent(questionId)}/image`;

const imageForm = (image: File) => {
  const form = new FormData();
  form.append('image', image);
  return form;
};

export const getTestImageSrc = (image: string) =>
  image.startsWith('/media/psy-tests/')
    ? $api.getUri({ url: image })
    : getImageSrc(image);

const isTest = (data: TPsyTest) =>
  !!data &&
  typeof data.id === 'string' &&
  typeof data.title === 'string' &&
  (data.type === 'Медицинский' || data.type === 'Развлекательный') &&
  (data.image === null || typeof data.image === 'string');

const readAttempt = (data: TTestAttempt) => {
  if (
    !data ||
    typeof data.id !== 'string' ||
    typeof data.user_id !== 'string' ||
    !Array.isArray(data.answers) ||
    (data.next_question !== null && !Array.isArray(data.next_question?.options))
  ) {
    throw new Error('Некорректные данные прохождения');
  }
  return data;
};

export const testApi = {
  list: async (skip: number, take: number, signal?: AbortSignal) => {
    const { data } = await $api.get<TPsyTest[]>(catalogPath, {
      params: { skip, take },
      signal,
      timeout,
    });
    if (!Array.isArray(data) || !data.every(isTest))
      throw new Error('Некорректный список тестов');
    return data;
  },

  byId: async (testId: string, signal?: AbortSignal) => {
    const { data } = await $api.get<TPsyTest>(testPath(testId), {
      signal,
      timeout,
    });
    if (!isTest(data)) throw new Error('Некорректные данные теста');
    return data;
  },

  create: async (data: TTestCreate) =>
    (await $api.post<TPsyTest>(catalogPath, data)).data,

  update: async (testId: string, data: TTestUpdate) =>
    (await $api.put<TPsyTest>(testPath(testId), data)).data,

  remove: async (testId: string) =>
    (await $api.delete<{ message: string }>(testPath(testId))).data,

  uploadImage: async (testId: string, image: File) =>
    (await $api.post<TPsyTest>(`${testPath(testId)}/image`, imageForm(image)))
      .data,

  removeImage: async (testId: string) =>
    (await $api.delete<TPsyTest>(`${testPath(testId)}/image`)).data,

  questions: async (testId: string, signal?: AbortSignal) =>
    (await $api.get<TTestQuestion[]>(questionsPath(testId), { signal })).data,

  replaceQuestions: async (testId: string, questions: TTestQuestionInput[]) =>
    (await $api.put<TTestQuestion[]>(questionsPath(testId), { questions }))
      .data,

  uploadQuestionImage: async (
    testId: string,
    questionId: string,
    image: File,
  ) =>
    (
      await $api.post<TTestQuestion>(
        questionImagePath(testId, questionId),
        imageForm(image),
      )
    ).data,

  removeQuestionImage: async (testId: string, questionId: string) =>
    (await $api.delete<TTestQuestion>(questionImagePath(testId, questionId)))
      .data,

  startAttempt: async (testId: string) =>
    readAttempt(
      (await $api.post<TTestAttempt>(attemptsPath(testId), null, { timeout }))
        .data,
    ),

  attempt: async (testId: string, attemptId: string, signal?: AbortSignal) =>
    readAttempt(
      (
        await $api.get<TTestAttempt>(attemptPath(testId, attemptId), {
          signal,
          timeout,
        })
      ).data,
    ),

  saveAnswer: async (
    testId: string,
    attemptId: string,
    questionId: string,
    answer: TTestAnswer,
  ) =>
    readAttempt(
      (
        await $api.put<TTestAttempt>(
          `${attemptPath(testId, attemptId)}/answers/${encodeURIComponent(questionId)}`,
          answer,
          { timeout },
        )
      ).data,
    ),
};
