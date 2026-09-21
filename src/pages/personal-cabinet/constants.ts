import type { ApplicationStatus } from '@/entities/application/types';
import type { AppointmentStatus } from '@/entities/appointment/types';

export const AppointmentStatusTag: Record<
  AppointmentStatus,
  { text: string; className: string }
> = {
  awaiting: { text: 'Ожидается', className: 'status-dot--awaiting' },
  done: { text: 'Завершено', className: 'status-dot--done' },
  cancelled: { text: 'Отменено', className: 'status-dot--cancelled' },
};

export const ApplicationStatusTag: Record<
  ApplicationStatus,
  { text: string; className: string }
> = {
  new: { text: 'Новая', className: 'status-dot--new' },
  in_progress: { text: 'В работе', className: 'status-dot--in-progress' },
  awaiting_user_confirmation: {
    text: 'На подтверждении',
    className: 'status-dot--awaiting-user-confirmation',
  },
  completed: { text: 'Завершено', className: 'status-dot--completed' },
  rejected: { text: 'Отменено', className: 'status-dot--cancelled' },
  cancelled: { text: 'Отменено', className: 'status-dot--cancelled' },
  expired: { text: 'Отменено', className: 'status-dot--cancelled' },
};
