import { $api } from '@/shared/api/http';
import type { TMessageResponse } from '@/shared/api/types';
import type { TTherapistStatus, TTherapistStatusRequest } from './types';

export const createTherapistStatus = async (
  userId: string,
  body: TTherapistStatusRequest,
) =>
  (await $api.post<TTherapistStatus>(`/therapists/${userId}/statuses`, body))
    .data;

export const deleteTherapistStatus = async (userId: string, statusId: string) =>
  (
    await $api.delete<TMessageResponse>(
      `/therapists/${userId}/statuses/${statusId}`,
    )
  ).data;
