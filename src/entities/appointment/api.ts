import { queryOptions } from '@tanstack/react-query';
import type {
  TAppointment,
  TAppointmentCreateRequest,
  TAppointmentReschedule,
} from '@/entities/appointment/types';
import { $api } from '@/shared/api/http';

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

  list: (params?: { user_id?: string }) =>
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
  cancelReason: string,
): Promise<void> => {
  await $api.put<void>(`/appointments/${id}/cancel`, {
    cancel_reason: cancelReason,
  });
};

export const completeAppointment = async (
  id: string,
  conclusion: string,
): Promise<void> => {
  await $api.put<void>(`/appointments/${id}/done`, {
    patient_comment: conclusion,
  });
};

export const createAppointment = async (
  body: TAppointmentCreateRequest,
): Promise<TAppointment> => {
  const { data } = await $api.post<TAppointment>('/appointments/create', body);
  return data;
};

export const requestAppointmentReschedule = async (
  id: string,
  scheduledTime: string,
): Promise<TAppointmentReschedule> =>
  (
    await $api.post<TAppointmentReschedule>(
      `/appointments/${id}/reschedule-requests`,
      { scheduled_time: scheduledTime },
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
