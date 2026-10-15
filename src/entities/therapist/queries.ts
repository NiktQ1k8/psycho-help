import { type QueryObserverOptions, queryOptions } from '@tanstack/react-query';
import { $api } from '@/shared/api/http.ts';
import type { TTherapist, TTherapistListParams } from './types';

export const therapistQueryKey = {
  list: 'therapist.list',
  byId: 'therapist.byId',
};

export const therapistQueries = {
  list: (params?: TTherapistListParams) => {
    const requestParams = { take: 100, ...params };
    return queryOptions<TTherapist[], Error>({
      queryKey: [therapistQueryKey.list, requestParams],
      queryFn: async ({ signal }) =>
        (
          await $api.get<TTherapist[]>('/therapists/', {
            signal,
            params: requestParams,
          })
        ).data,
    });
  },

  byId: (
    id: string,
    options?: Partial<QueryObserverOptions<TTherapist, Error>>,
  ) =>
    queryOptions<TTherapist, Error>({
      ...options,
      queryKey: [therapistQueryKey.byId, id],
      queryFn: async ({ signal }) =>
        (await $api.get<TTherapist>(`/therapists/${id}`, { signal })).data,
      enabled: id ? (options?.enabled ?? true) : false,
    }),
};
