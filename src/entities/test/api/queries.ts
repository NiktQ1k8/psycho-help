import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { testApi } from './tests';

const PAGE_SIZE = 6;

export const testQueryKey = {
  list: 'test.list',
  byId: 'test.byId',
  questions: 'test.questions',
  attempt: 'test.attempt',
};

export const testQueries = {
  list: () =>
    infiniteQueryOptions({
      queryKey: [testQueryKey.list],
      networkMode: 'always',
      initialPageParam: 0,
      queryFn: ({ pageParam, signal }) =>
        testApi.list(pageParam, PAGE_SIZE, signal),
      getNextPageParam: (page, _pages, skip) =>
        page.length === PAGE_SIZE ? skip + page.length : undefined,
    }),

  byId: (testId: string) =>
    queryOptions({
      queryKey: [testQueryKey.byId, testId],
      networkMode: 'always',
      queryFn: ({ signal }) => testApi.byId(testId, signal),
      enabled: !!testId,
    }),

  questions: (testId: string, userId: string) =>
    queryOptions({
      queryKey: [testQueryKey.questions, userId, testId],
      queryFn: ({ signal }) => testApi.questions(testId, signal),
      enabled: !!testId && !!userId,
    }),

  attempt: (testId: string, userId: string, attemptId: string) =>
    queryOptions({
      queryKey: [testQueryKey.attempt, userId, testId, attemptId],
      networkMode: 'always',
      queryFn: ({ signal }) => testApi.attempt(testId, attemptId, signal),
      enabled: !!testId && !!userId && !!attemptId,
    }),
};
