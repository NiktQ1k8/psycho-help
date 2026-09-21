import { queryOptions } from '@tanstack/react-query';
import { $api } from '@/shared/api/http';
import type {
  Application,
  ApplicationCreateRequest,
  ApplicationStatus,
  CancelRequest,
  MeetingType,
} from './types';

export const applicationQueryKey = {
  list: 'application.list',
  byId: 'application.byId',
};

export const applicationQueries = {
  list: (params?: {
    skip?: number;
    limit?: number;
    status?: ApplicationStatus;
    assigned_to?: string;
    sort_by?: string;
    sort_desc?: boolean;
  }) => {
    const requestParams = { limit: 100, ...params };

    return queryOptions<Application[]>({
      queryKey: [applicationQueryKey.list, requestParams],
      queryFn: async () =>
        (await $api.get('/applications/', { params: requestParams })).data,
    });
  },

  byId: (id: string) =>
    queryOptions<Application>({
      queryKey: [applicationQueryKey.byId, id],
      queryFn: async () => (await $api.get(`/applications/${id}`)).data,
      enabled: !!id,
    }),
};

export const acceptApplication = async (
  applicationId: string,
  assignedTo: string,
) => {
  const { data } = await $api.post<Application>(
    `/applications/${applicationId}/accept`,
    {
      assigned_to: assignedTo,
    },
  );
  return data;
};

export const offerConsultation = async (
  applicationId: string,
  body: {
    psychologist_id: string;
    meeting_type: MeetingType;
    scheduled_at: string;
    location_address?: string | null;
    meeting_url?: string | null;
  },
) => {
  const { data } = await $api.post<Application>(
    `/applications/${applicationId}/offer`,
    body,
  );
  return data;
};

export const rejectApplication = async (
  applicationId: string,
  rejectReason: string,
) => {
  const { data } = await $api.post<Application>(
    `/applications/${applicationId}/reject`,
    {
      reject_reason: rejectReason,
    },
  );
  return data;
};

export const cancelApplication = async (
  applicationId: string,
  payload: CancelRequest,
) => {
  const { data } = await $api.post<Application>(
    `/applications/${applicationId}/cancel`,
    payload,
  );
  return data;
};

export const createApplication = async (body: ApplicationCreateRequest) => {
  const { data } = await $api.post<Application>('/applications/', body);
  return data;
};

export const confirmApplication = async (
  applicationId: string,
  appointmentId?: string,
) => {
  const { data } = await $api.post<Application>(
    `/applications/${applicationId}/confirm`,
    null,
    {
      params: appointmentId ? { appointment_id: appointmentId } : undefined,
    },
  );
  return data;
};

export const getUniversityStatuses = async () => {
  const { data } = await $api.get<string[]>(
    '/applications/university-statuses',
  );
  return data;
};
