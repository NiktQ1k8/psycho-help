import { type QueryObserverOptions, queryOptions } from '@tanstack/react-query';
import type { ResponseError } from '@/shared/api';
import { $api } from '@/shared/api/http.ts';
import type { Therapist } from '../types';

export const therapistQueryKey = {
  list: 'therapist.list',
  byId: 'therapist.byId',
};

export const therapistQueries = {
  list: (options?: Partial<QueryObserverOptions<Therapist[], ResponseError>>) =>
    queryOptions<Therapist[], ResponseError>({
      queryKey: [therapistQueryKey.list],
      queryFn: async () => (await $api.get('/therapists/')).data,
      ...options,
    }),

  byId: (
    id: string,
    options?: Partial<QueryObserverOptions<Therapist, ResponseError>>,
  ) =>
    queryOptions<Therapist, ResponseError>({
      queryKey: [therapistQueryKey.byId],
      queryFn: async () => (await $api.get(`/therapists/${id}`)).data,
      enabled: !!id,
      ...options,
    }),
};
