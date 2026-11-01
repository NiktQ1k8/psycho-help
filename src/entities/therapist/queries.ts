import { type QueryObserverOptions, queryOptions } from '@tanstack/react-query';
import { $api } from '@/shared/api/http.ts';
import type {
  TTherapist,
  TTherapistListParams,
  TTherapistSchedule,
  TTherapistScheduleParams,
  TTherapistStatus,
} from './types';

export const therapistQueryKey = {
  list: 'therapist.list',
  byId: 'therapist.byId',
  schedule: 'therapist.schedule',
  statuses: 'therapist.statuses',
};

export const therapistQueries = {
  statuses: (userId: string) =>
    queryOptions({
      queryKey: [therapistQueryKey.statuses, userId],
      queryFn: async ({ signal }) =>
        (
          await $api.get<TTherapistStatus[]>(`/therapists/${userId}/statuses`, {
            signal,
          })
        ).data,
      enabled: !!userId,
    }),

  schedule: (id: string, params?: TTherapistScheduleParams) =>
    queryOptions({
      queryKey: [therapistQueryKey.schedule, id, params],
      queryFn: async ({ signal }) =>
        (
          await $api.get<TTherapistSchedule>(`/therapists/${id}/schedule`, {
            params,
            signal,
          })
        ).data,
      enabled: !!id,
    }),

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
