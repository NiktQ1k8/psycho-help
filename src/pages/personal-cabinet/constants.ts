import type { TApplicationStatus } from '@/entities/application/types';

export const ApplicationStatusTag: Record<
  TApplicationStatus,
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
