import { isAxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { refreshSession } from '@/entities/auth/api';
import { useAuth } from '@/entities/auth/model/useAuth';
import { useAppointmentBooking } from '@/features/personal-cabinet/model/appointment-booking';
import { useCabinetDrafts } from '@/features/personal-cabinet/model/cabinet-drafts';
import { usePsychologistDrafts } from '@/features/personal-cabinet/model/psychologist-drafts';
import { usePsychologistView } from '@/features/personal-cabinet/model/psychologist-view';
import { $api } from '@/shared/api/http';

type TSessionRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const setupSession = () => {
  const unsubscribe = useAuth.subscribe((state, previous) => {
    if (state.user && (!previous.user || state.user.id === previous.user.id)) {
      return;
    }
    useAppointmentBooking.setState(
      useAppointmentBooking.getInitialState(),
      true,
    );
    useCabinetDrafts.setState(useCabinetDrafts.getInitialState(), true);
    usePsychologistDrafts.setState(
      usePsychologistDrafts.getInitialState(),
      true,
    );
    usePsychologistView.getState().resetView();
  });

  const interceptor = $api.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!isAxiosError(error) || error.response?.status !== 401) {
        throw error;
      }

      const request = error.config as TSessionRequestConfig | undefined;
      if (!request) throw error;
      if (request._retry) {
        useAuth.getState().resetSession();
        throw error;
      }

      request._retry = true;
      try {
        await refreshSession();
      } catch (refreshError) {
        if (
          isAxiosError(refreshError) &&
          refreshError.response?.status === 401
        ) {
          useAuth.getState().resetSession();
        }
        throw refreshError;
      }
      return $api(request);
    },
  );

  return () => {
    unsubscribe();
    $api.interceptors.response.eject(interceptor);
  };
};
