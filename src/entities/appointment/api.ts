import { queryOptions } from '@tanstack/react-query';
import type {
  TAppointment,
  TAppointmentCreateRequest,
} from '@/entities/appointment/types';
import { $api } from '@/shared/api/http';

export const appointmentQueryKey = {
  list: 'appointment.list',
  byId: 'appointment.byId',
};

export const appointmentQueries = {
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
