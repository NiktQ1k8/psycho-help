import { queryOptions } from '@tanstack/react-query';
import { $api } from '@/shared/api/http';
import type {
  TApplication,
  TApplicationCreateRequest,
  TApplicationListParams,
  TCancelRequest,
  TOfferConsultationRequest,
  TUniversityStatus,
} from './types';

export const applicationQueryKey = {
  list: 'application.list',
  byId: 'application.byId',
  universityStatuses: 'application.universityStatuses',
};

export const applicationQueries = {
  universityStatuses: () =>
    queryOptions({
      queryKey: [applicationQueryKey.universityStatuses],
      queryFn: ({ signal }) => getUniversityStatuses(signal),
    }),
  list: (params?: TApplicationListParams) => {
    const requestParams = { limit: 100, ...params };

    return queryOptions<TApplication[]>({
      queryKey: [applicationQueryKey.list, requestParams],
      queryFn: async ({ signal }) =>
        (
          await $api.get<TApplication[]>('/applications/', {
            params: requestParams,
            signal,
          })
        ).data,
    });
  },

  byId: (id: string) =>
    queryOptions<TApplication>({
      queryKey: [applicationQueryKey.byId, id],
      queryFn: async ({ signal }) =>
        (await $api.get<TApplication>(`/applications/${id}`, { signal })).data,
      enabled: !!id,
    }),
};

export const acceptApplication = async (
  applicationId: string,
  assignedTo: string,
) => {
  const { data } = await $api.post<TApplication>(
    `/applications/${applicationId}/accept`,
    {
      assigned_to: assignedTo,
    },
  );
  return data;
};

export const offerConsultation = async (
  applicationId: string,
  body: TOfferConsultationRequest,
) => {
  const { data } = await $api.post<TApplication>(
    `/applications/${applicationId}/offer`,
    body,
  );
  return data;
};

export const rejectApplication = async (
  applicationId: string,
  rejectReason: string,
) => {
  const { data } = await $api.post<TApplication>(
    `/applications/${applicationId}/reject`,
    {
      reject_reason: rejectReason,
    },
  );
  return data;
};

export const cancelApplication = async (
  applicationId: string,
  payload: TCancelRequest,
) => {
  const { data } = await $api.post<TApplication>(
    `/applications/${applicationId}/cancel`,
    payload,
  );
  return data;
};

export const createApplication = async (body: TApplicationCreateRequest) => {
  const { data } = await $api.post<TApplication>('/applications/', body);
  return data;
};

export const getUniversityStatuses = async (signal?: AbortSignal) => {
  const { data } = await $api.get<TUniversityStatus[]>(
    '/applications/university-statuses',
    { signal },
  );
  return data;
};
