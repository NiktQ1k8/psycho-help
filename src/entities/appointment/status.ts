import type { TAppointmentStatus } from './types';

export const AppointmentStatusTag: Record<
  TAppointmentStatus,
  { text: string; className: string }
> = {
  awaiting: { text: 'Ожидается', className: 'status-dot--awaiting' },
  done: { text: 'Завершено', className: 'status-dot--done' },
  cancelled: { text: 'Отменено', className: 'status-dot--cancelled' },
};
