import { queryOptions } from '@tanstack/react-query';
import type {
  Appointment,
  AppointmentCreateRequest,
} from '@/entities/appointment/types';
import { $api } from '@/shared/api/http';

export const appointmentQueryKey = {
  list: 'appointment.list',
  byId: 'appointment.byId',
};

export const appointmentQueries = {
  list: (params?: { user_id?: string }) =>
    queryOptions<Appointment[]>({
      queryKey: [appointmentQueryKey.list, params],
      queryFn: async () => (await $api.get('/appointments/', { params })).data,
    }),

  byId: (id: string) =>
    queryOptions<Appointment>({
      queryKey: [appointmentQueryKey.byId, id],
      queryFn: async () => (await $api.get(`/appointments/${id}`)).data,
      enabled: !!id,
    }),
};

export const cancelAppointment = async (
  id: string,
  cancelReason: string,
): Promise<void> => {
  await $api.put(`/appointments/${id}/cancel`, { cancel_reason: cancelReason });
};

export const completeAppointment = async (
  id: string,
  conclusion: string,
): Promise<Appointment> => {
  const { data } = await $api.put(`/appointments/${id}/done`, { conclusion });
  return data;
};

export const createAppointment = async (
  body: AppointmentCreateRequest,
): Promise<Appointment> => {
  const { data } = await $api.post<Appointment>('/appointments/create', body);
  return data;
};
