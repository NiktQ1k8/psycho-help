import { queryOptions } from '@tanstack/react-query';
import type {
  TAppointment,
  TAppointmentCancelRequest,
  TAppointmentCreateRequest,
  TAppointmentDoneRequest,
  TAppointmentEmergencyContactRequest,
  TAppointmentListParams,
  TAppointmentReschedule,
  TAppointmentRescheduleRequest,
} from '@/entities/appointment/types';
import { $api } from '@/shared/api/http';
import type { TMessageResponse } from '@/shared/api/types';

export const appointmentQueryKey = {
  list: 'appointment.list',
  byId: 'appointment.byId',
  reschedules: 'appointment.reschedules',
};

export const appointmentQueries = {
  reschedules: (id: string) =>
    queryOptions({
      queryKey: [appointmentQueryKey.reschedules, id],
      queryFn: async ({ signal }) =>
        (
          await $api.get<TAppointmentReschedule[]>(
            `/appointments/${id}/reschedule-requests`,
            { signal },
          )
        ).data,
      enabled: !!id,
    }),

  list: (params?: TAppointmentListParams) =>
    queryOptions<TAppointment[]>({
      queryKey: [appointmentQueryKey.list, params],
      queryFn: async ({ signal }) =>
        (await $api.get<TAppointment[]>('/appointments/', { params, signal }))
          .data,
    }),

  byId: (id: string) =>
    queryOptions<TAppointment>({
      queryKey: [appointmentQueryKey.byId, id],
      queryFn: async ({ signal }) =>
        (await $api.get<TAppointment>(`/appointments/${id}`, { signal })).data,
      enabled: !!id,
    }),
};

export const cancelAppointment = async (
  id: string,
  body: TAppointmentCancelRequest,
): Promise<TMessageResponse> => {
  const { data } = await $api.put<TMessageResponse>(
    `/appointments/${id}/cancel`,
    body,
  );
  return data;
};

export const completeAppointment = async (
  id: string,
  body: TAppointmentDoneRequest,
): Promise<TMessageResponse> => {
  const { data } = await $api.put<TMessageResponse>(
    `/appointments/${id}/done`,
    body,
  );
  return data;
};

export const requestAppointmentReschedule = async (
  id: string,
  body: TAppointmentRescheduleRequest,
): Promise<TAppointmentReschedule> =>
  (
    await $api.post<TAppointmentReschedule>(
      `/appointments/${id}/reschedule-requests`,
      body,
    )
  ).data;

export const confirmAppointmentReschedule = async (
  requestId: string,
): Promise<TAppointmentReschedule> =>
  (
    await $api.post<TAppointmentReschedule>(
      `/appointments/reschedule-requests/${requestId}/confirm`,
    )
  ).data;

export const rejectAppointmentReschedule = async (
  requestId: string,
  reason: string,
): Promise<TAppointmentReschedule> =>
  (
    await $api.post<TAppointmentReschedule>(
      `/appointments/reschedule-requests/${requestId}/cancel`,
      { rejection_comment: reason },
    )
  ).data;

export const createAppointment = async (body: TAppointmentCreateRequest) =>
  (await $api.post<TAppointment>('/appointments/create', body)).data;

export const updateAppointmentEmergencyContact = async (
  id: string,
  body: TAppointmentEmergencyContactRequest,
) =>
  (
    await $api.patch<TAppointment>(
      `/appointments/${id}/emergency-contact`,
      body,
    )
  ).data;
